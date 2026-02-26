import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import Loader from "../components/common/Loader";
import Alert from "../components/common/Alert";
import DemoPaymentGateway from "../components/payments/DemoPaymentGateway";
import AddPaymentModal from "../components/payments/AddPaymentModal";
import { formatCurrency, formatDate } from "../utils/formatters";
import { CreditCardIcon } from "@heroicons/react/24/outline";

const Payments = () => {
  const { isLandlord, isTenant } = useAuth();
  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Auto-dismiss success message after 2 seconds
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 2000);
    return () => clearTimeout(t);
  }, [success]);

  // Auto-dismiss error message after 2 seconds
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 2000);
    return () => clearTimeout(t);
  }, [error]);

  useEffect(() => {
    fetchPayments();
  }, [filter]);

  const fetchPayments = async () => {
    try {
      const params = filter !== "all" ? { status: filter } : {};
      const res = await api.get("/payments", { params });
      setPayments(res.data.payments || []);
    } catch {
      setError("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async (id) => {
    try {
      const res = await api.get(`/payments/${id}/receipt`, { responseType: "blob" });

      const contentDisposition = res.headers["content-disposition"] || "";
      let filename = "payment-receipt.pdf";
      const match = contentDisposition.match(/filename[^;=\n]*=((['"])?.*?\2|[^;\n]*)/i);
      if (match && match[1]) {
        filename = match[1].replace(/['"]/g, "");
      }

      const blob = new Blob([res.data], { type: res.headers["content-type"] || "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setSuccess("Receipt download started");
    } catch (e) {
      let message = "Failed to download receipt";
      const resp = e.response;
      if (resp?.data instanceof Blob) {
        try {
          const text = await resp.data.text();
          try {
            const json = JSON.parse(text);
            message = json.message || message;
          } catch {
            message = text || message;
          }
        } catch {}
      } else if (typeof resp?.data === "string") {
        message = resp.data;
      } else if (resp?.data?.message) {
        message = resp.data.message;
      }
      setError(message);
    }
  };

  const isOverdue = (p) =>
    p.status === "pending" && new Date(p.dueDate) < new Date();

  if (loading) return <Loader fullScreen />;

  return (
    <div className="min-h-screen bg-black text-white py-12 px-6">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-5xl font-extrabold gold">Payments</h1>
            <p className="text-gray-400 mt-1">
              Track and manage rent payments
            </p>
          </div>
          {isLandlord && (
            <button
              onClick={() => setShowAddModal(true)}
              className="rounded-xl border border-[#D4AF37] px-5 py-3 font-semibold text-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.35)] transition hover:bg-[#D4AF37] hover:text-black"
            >
              + Add Payment
            </button>
          )}
          {isTenant && (
            <button
              onClick={() => setSelectedPayment("makePayment")}
              className="flex items-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-3 font-semibold text-black shadow-[0_0_20px_rgba(212,175,55,0.35)] transition hover:bg-[#e5c56a]"
            >
              <CreditCardIcon className="h-5 w-5" />
              Make Payment
            </button>
          )}
        </div>

        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        {/* FILTERS */}
        <div className="flex gap-3">
          {["all", "pending", "paid", "failed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-lg font-semibold transition
                ${
                  filter === f
                    ? "bg-[#D4AF37] text-black shadow-lg"
                    : "bg-white/10 text-gray-300 border border-white/20 hover:bg-white/20"
                }`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>

        {/* PAYMENT CARDS */}
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {payments.map((p) => (
            <div
              key={p._id}
              className="
                relative
                bg-gradient-to-br from-black/70 to-black/40
                backdrop-blur-xl
                border border-[#D4AF37]/30
                rounded-3xl
                p-7
                shadow-[0_0_40px_rgba(212,175,55,0.18)]
                hover:shadow-[0_0_65px_rgba(212,175,55,0.35)]
                hover:-translate-y-1
                transition-all duration-300
              "
            >
              {/* TOP */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {p.property?.name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    Due: {formatDate(p.dueDate)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-3xl font-extrabold gold">
                    {formatCurrency(p.amount)}
                  </p>
                  <span
                    className={`inline-block mt-2 px-4 py-1 rounded-full text-xs font-bold tracking-wide
                      ${
                        isOverdue(p)
                          ? "bg-red-500/30 text-red-300"
                          : p.status === "paid"
                          ? "bg-green-500/30 text-green-300"
                          : "bg-yellow-500/30 text-yellow-300"
                      }`}
                  >
                    {isOverdue(p) ? "OVERDUE" : p.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* RECEIPT BOX (STRONG HIGHLIGHT) */}
              <div
                className="
                  mt-6 p-5 rounded-2xl
                  bg-gradient-to-br from-[#D4AF37]/10 to-black/40
                  border border-[#D4AF37]/50
                  shadow-inner
                "
              >
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Tenant</span>
                  <span className="text-white font-semibold">
                    {p.tenant?.name || "—"}
                  </span>
                </div>

                <div className="flex justify-between text-sm mt-3">
                  <span className="text-gray-300">Paid on</span>
                  <span className="text-white font-semibold">
                    {p.paidDate ? formatDate(p.paidDate) : "—"}
                  </span>
                </div>
              </div>

              {/* DOWNLOAD RECEIPT */}
              {p.status === "paid" && (
                <button
                  onClick={() => handleDownloadReceipt(p._id)}
                  className="
                    mt-6 w-full
                    py-3 rounded-xl
                    border border-[#D4AF37]
                    text-[#D4AF37]
                    font-semibold
                    tracking-wide
                    hover:bg-[#D4AF37]
                    hover:text-black
                    shadow-[0_0_20px_rgba(212,175,55,0.35)]
                    transition
                  "
                >
                  ⬇ Download Receipt
                </button>
              )}

              {/* PAY NOW BUTTON FOR TENANTS */}
              {isTenant && p.status === "pending" && (
                <button
                  onClick={() => setSelectedPayment(p)}
                  className="
                    mt-6 w-full
                    py-3 rounded-xl
                    bg-[#D4AF37]
                    text-black
                    font-semibold
                    tracking-wide
                    hover:bg-[#e5c56a]
                    shadow-[0_0_20px_rgba(212,175,55,0.35)]
                    transition
                  "
                >
                  💳 Pay Now
                </button>
              )}
            </div>
          ))}
        </div>

        {/* PAYMENT MODAL */}
        {selectedPayment && selectedPayment !== "makePayment" && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="lux-card max-w-lg w-full">
              <DemoPaymentGateway
                paymentId={selectedPayment._id}
                amount={selectedPayment.amount}
                onSuccess={(data) => {
                  setSuccessMessage(`Payment of ${formatCurrency(selectedPayment.amount)} successful!`);
                  setShowSuccessPopup(true);
                  setSelectedPayment(null);
                  setLoading(true);
                  fetchPayments();
                }}
              />
            </div>
          </div>
        )}

        {/* TENANT MAKE PAYMENT MODAL */}
        {selectedPayment === "makePayment" && isTenant && (
          <TenantPaymentSelector
            payments={payments.filter(p => p.status === "pending")}
            onSelectPayment={(payment) => setSelectedPayment(payment)}
            onClose={() => setSelectedPayment(null)}
          />
        )}

        {/* ADD PAYMENT MODAL */}
        {showAddModal && isLandlord && (
          <AddPaymentModal
            onClose={() => setShowAddModal(false)}
            onCreated={() => {
              setSuccess("Payment created successfully");
              setShowAddModal(false);
              setLoading(true);
              fetchPayments();
            }}
          />
        )}

        {/* SUCCESS POPUP */}
        {showSuccessPopup && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-black border-2 border-[#D4AF37] rounded-2xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(212,175,55,0.5)] animate-scale-in">
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
                <p className="text-[#D4AF37] text-lg font-semibold mb-4">{successMessage}</p>
                <p className="text-gray-400 text-sm mb-6">Your receipt has been generated and can be downloaded below.</p>
                <button
                  onClick={() => setShowSuccessPopup(false)}
                  className="w-full py-3 bg-[#D4AF37] hover:bg-[#e5c56a] text-black font-semibold rounded-lg transition"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const TenantPaymentSelector = ({ payments, onSelectPayment, onClose }) => {
  if (payments.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-black border border-[#D4AF37]/30 rounded-2xl p-8 w-full max-w-lg shadow-[0_0_30px_rgba(212,175,55,0.2)]">
          <h2 className="text-2xl font-bold text-white mb-4">No Pending Payments</h2>
          <p className="text-gray-400 mb-6">You have no pending payments to make right now.</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-[#D4AF37] hover:bg-[#e5c56a] text-black font-semibold rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-[#D4AF37]/30 rounded-2xl p-8 w-full max-w-lg shadow-[0_0_30px_rgba(212,175,55,0.2)]">
        <h2 className="text-2xl font-bold text-white mb-6">Select Payment to Make</h2>
        
        <div className="space-y-3 max-h-64 overflow-y-auto mb-6">
          {payments.map((payment) => (
            <button
              key={payment._id}
              onClick={() => onSelectPayment(payment)}
              className="w-full p-4 border border-white/20 rounded-lg hover:border-[#D4AF37] hover:bg-white/5 transition text-left"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white font-semibold">{payment.property?.name}</p>
                  <p className="text-sm text-gray-400">Due: {formatDate(payment.dueDate)}</p>
                </div>
                <p className="text-[#D4AF37] font-bold">{formatCurrency(payment.amount)}</p>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default Payments;
