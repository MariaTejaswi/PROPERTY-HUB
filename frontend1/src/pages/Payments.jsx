import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import Loader from "../components/common/Loader";
import Alert from "../components/common/Alert";
import DemoPaymentGateway from "../components/payments/DemoPaymentGateway";
import { formatCurrency, formatDate } from "../utils/formatters";

const Payments = () => {
  const { isLandlord, isTenant } = useAuth();
  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);

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
    alert("Downloading receipt...");
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
            </div>
          ))}
        </div>

        {/* PAYMENT MODAL */}
        {selectedPayment && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="lux-card max-w-lg w-full">
              <DemoPaymentGateway
                paymentId={selectedPayment._id}
                amount={selectedPayment.amount}
                onSuccess={() => setSelectedPayment(null)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;
