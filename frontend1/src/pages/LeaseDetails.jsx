import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import Alert from "../components/common/Alert";
import { formatCurrency, formatDate } from "../utils/formatters";

const LeaseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLandlord, isTenant } = useAuth();

  const [lease, setLease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSignModal, setShowSignModal] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signatureFile, setSignatureFile] = useState(null);

  useEffect(() => {
    fetchLease();
    // eslint-disable-next-line
  }, [id]);

  const fetchLease = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/leases/${id}`);
      setLease(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch lease details");
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    try {
      setSigning(true);
      if (!signatureFile) {
        setError("Please upload your signature image");
        return;
      }

      const formData = new FormData();
      formData.append("signature", signatureFile);
      await api.post(`/leases/${id}/sign`, formData);

      setShowSignModal(false);
      setSignatureFile(null);
      fetchLease();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save signature");
    } finally {
      setSigning(false);
    }
  };

  const canSign = () => {
    if (!lease || !lease.signatures) return false;

    if (isLandlord && !lease.signatures.landlord?.signed) return true;
    if (
      isTenant &&
      !lease.signatures.tenant?.signed &&
      lease.tenant._id === user.id
    )
      return true;

    return false;
  };

  const isFullySigned = () => {
    return (
      lease?.signatures?.landlord?.signed &&
      lease?.signatures?.tenant?.signed
    );
  };

  const downloadPDF = async () => {
    try {
      const response = await api.get(`/leases/${id}/document`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", `lease-${lease.property.name}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to download PDF");
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this lease? This action cannot be undone."
      )
    )
      return;

    try {
      await api.delete(`/leases/${id}`);
      navigate("/leases");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete lease");
    }
  };

  if (loading) return <Loader fullScreen />;

  if (error && !lease)
    return (
      <div className="min-h-screen bg-black text-white p-10">
        <Alert type="error" message={error} />
        <Button onClick={() => navigate("/leases")}>Back to Leases</Button>
      </div>
    );

  if (!lease)
    return (
      <div className="min-h-screen bg-black text-white p-10">
        <h1>Lease not found</h1>
        <Button onClick={() => navigate("/leases")}>Back to Leases</Button>
      </div>
    );

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-emerald-600 text-white";
      case "draft":
        return "bg-yellow-500 text-black";
      case "expired":
        return "bg-red-600 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* LEFT MAIN SECTION */}
        <div className="lg:col-span-2 space-y-10">

          {/* HEADER ACTIONS */}
          <div className="flex flex-wrap justify-between items-center gap-4">
            <Button variant="secondary" onClick={() => navigate("/leases")}>
              ← Back to Leases
            </Button>

            <div className="flex gap-4">
              {isLandlord && lease.status === "draft" && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => navigate(`/leases/${id}/edit`)}
                  >
                    Edit Lease
                  </Button>
                  <Button variant="danger" onClick={handleDelete}>
                    Delete
                  </Button>
                </>
              )}

              {canSign() && (
                <Button onClick={() => setShowSignModal(true)}>
                  Sign Lease
                </Button>
              )}

              <Button variant="secondary" onClick={downloadPDF}>
                Download PDF
              </Button>
            </div>
          </div>

          {/* FULLY SIGNED NOTICE */}
          {isFullySigned() && (
            <div className="bg-emerald-600/20 border border-emerald-600 text-emerald-300 px-6 py-4 rounded-xl font-medium">
              ✓ This lease has been fully signed by both parties
            </div>
          )}

          {/* LEASE HEADER CARD */}
          <Card>
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">Lease Agreement</h1>
              <span
                className={`px-4 py-1 rounded-full text-sm font-semibold capitalize ${getStatusColor(
                  lease.status
                )}`}
              >
                {lease.status}
              </span>
            </div>
          </Card>

          {/* PROPERTY INFORMATION */}
          <Card title="Property Information">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-[#D4AF37]">
                {lease.property.name}
              </h3>
              <p className="text-gray-300">{lease.property.address.street}</p>
              <p className="text-gray-300">
                {lease.property.address.city}, {lease.property.address.state}{" "}
                {lease.property.address.zipCode}
              </p>

              <div className="flex gap-4 text-gray-400 pt-2">
                <span>{lease.property.bedrooms} bed</span>
                <span>•</span>
                <span>{lease.property.bathrooms} bath</span>
                <span>•</span>
                <span>{lease.property.squareFeet} sq ft</span>
              </div>

              <Button
                variant="secondary"
                onClick={() =>
                  navigate(`/properties/${lease.property._id}`)
                }
                className="mt-4"
              >
                View Property Details
              </Button>
            </div>
          </Card>

          {/* LEASE TERMS */}
          <Card title="Lease Terms">
            <div className="space-y-4">

              <TermRow label="Monthly Rent" value={formatCurrency(lease.rentAmount)} highlight />
              <TermRow
                label="Security Deposit"
                value={
                  typeof lease.depositAmount === 'number'
                    ? formatCurrency(lease.depositAmount)
                    : '—'
                }
              />
              <TermRow label="Start Date" value={formatDate(lease.startDate)} />
              <TermRow label="End Date" value={formatDate(lease.endDate)} />
              <TermRow label="Payment Due Day" value={`Day ${lease.paymentDueDay} each month`} />
              {typeof lease.lateFee === 'number' && typeof lease.gracePeriodDays === 'number' && (
                <TermRow
                  label="Late Fee"
                  value={`${formatCurrency(lease.lateFee)} after ${lease.gracePeriodDays} days`}
                />
              )}

            </div>
          </Card>

          {/* ADDITIONAL TERMS */}
          {lease.terms && (
            <Card title="Additional Terms & Conditions">
              <p className="text-gray-300 leading-relaxed">{lease.terms}</p>
            </Card>
          )}

          {/* DIGITAL SIGNATURES */}
          <Card title="Signatures">
            <div className="grid sm:grid-cols-2 gap-8">

              {/* LANDLORD SIGNATURE */}
              <SignatureBlock
                title="Landlord Signature"
                signature={lease.signatures.landlord}
                name={lease.landlord.name}
              />

              {/* TENANT SIGNATURE */}
              <SignatureBlock
                title="Tenant Signature"
                signature={lease.signatures.tenant}
                name={lease.tenant.name}
              />

            </div>
          </Card>

        </div>

        {/* RIGHT SIDEBAR */}
        <div className="space-y-10">

          <SidebarCard title="Landlord" user={lease.landlord} />
          <SidebarCard title="Tenant" user={lease.tenant} />

          <Card title="Lease Duration">
            <div className="space-y-2 text-gray-300">
              <p>
                <strong>Start:</strong> {formatDate(lease.startDate)}
              </p>
              <p>
                <strong>End:</strong> {formatDate(lease.endDate)}
              </p>
              <p className="pt-2 text-gray-400">
                {Math.ceil(
                  (new Date(lease.endDate) - new Date(lease.startDate)) /
                    (1000 * 60 * 60 * 24 * 30)
                )}{" "}
                months
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* SIGNATURE MODAL */}
      {showSignModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setShowSignModal(false)}
        >
          <div
            className="bg-black/70 backdrop-blur-xl w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-[#D4AF37]/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#D4AF37]">Upload Signature</h2>
              <button
                onClick={() => setShowSignModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <p className="text-gray-400 mb-4">
              Upload an image of your signature (PNG or JPG).
            </p>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSignatureFile(e.target.files?.[0] || null)}
              className="text-gray-300"
            />

            <div className="flex justify-end gap-3 mt-8">
              <Button variant="outline" onClick={() => setShowSignModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSign} disabled={signing || !signatureFile}>
                {signing ? "Uploading..." : "Submit"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------------------------------------------
   Subcomponents
--------------------------------------------- */

const TermRow = ({ label, value, highlight }) => (
  <div className="flex justify-between border-b border-white/10 pb-2">
    <span className="text-gray-400">{label}</span>
    <span className={highlight ? "text-[#D4AF37] font-semibold" : "text-gray-300"}>
      {value}
    </span>
  </div>
);

const getSignatureSrc = (signatureData) => {
  if (!signatureData) return null;
  if (signatureData.startsWith("data:")) return signatureData;
  // Stored as a server path like "uploads/leases/..." or "/uploads/leases/..."
  const normalized = signatureData.replace(/\\/g, "/");
  const path = normalized.startsWith("/") ? normalized : `/${normalized}`;
  return `http://localhost:5000${path}`;
};

const SignatureBlock = ({ title, signature, name }) => (
  <div>
    <h4 className="font-semibold text-[#D4AF37] mb-2">{title}</h4>

    {signature?.signed ? (
      <div>
        {getSignatureSrc(signature.signatureData) ? (
          <img
            src={getSignatureSrc(signature.signatureData)}
            alt="Signature"
            className="w-full rounded-xl p-3 border border-[#D4AF37]/20 bg-black/40"
          />
        ) : (
          <p className="text-gray-500 text-sm italic">Signature image missing</p>
        )}
        <p className="text-gray-400 text-sm mt-2">
          Signed on {formatDate(signature.signedAt)}
        </p>
        <p className="text-gray-300 text-sm">{name}</p>
      </div>
    ) : (
      <p className="text-gray-500 text-sm italic">Awaiting signature</p>
    )}
  </div>
);

const SidebarCard = ({ title, user }) => (
  <Card title={title}>
    <div className="flex items-center gap-4">
      <div className="bg-[#D4AF37] text-black h-12 w-12 flex items-center justify-center rounded-full text-xl font-bold">
        {user.name.charAt(0).toUpperCase()}
      </div>
      <div>
        <p className="font-semibold text-white">{user.name}</p>
        <p className="text-gray-400 text-sm">{user.email}</p>
        <p className="text-gray-500 text-sm">{user.phone || "N/A"}</p>
      </div>
    </div>
  </Card>
);

export default LeaseDetails;
