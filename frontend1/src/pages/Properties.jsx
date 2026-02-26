import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import Loader from "../components/common/Loader";
import Alert from "../components/common/Alert";
import DemoPaymentGateway from "../components/payments/DemoPaymentGateway";
import { formatCurrency } from "../utils/formatters";
import {
  PlusIcon,
  MapPinIcon,
  HomeIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";

const Properties = () => {
  const { isLandlord, isTenant, user } = useAuth();
  const navigate = useNavigate();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await api.get("/properties");
      setProperties(response.data.properties || []);
    } catch (err) {
      setError("Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this property?")) return;

    try {
      await api.delete(`/properties/${id}`);
      setProperties((prev) => prev.filter((p) => p._id !== id));
    } catch {
      setError("Failed to delete property");
    }
  };

  const handleMakePayment = async (propertyId) => {
    try {
      // Fetch pending payment for this specific property
      const response = await api.get("/payments", { 
        params: { 
          status: "pending",
          propertyId: propertyId 
        } 
      });
      const payments = response.data.payments || [];
      
      if (payments.length === 0) {
        setError("No payment found. Please ask your landlord to create a payment for this property.");
        // Optionally, navigate to payments page where they can see all their payments
        setTimeout(() => {
          navigate("/payments");
        }, 2000);
        return;
      }
      
      // Use the first (and should be only) pending payment for this property
      setSelectedPayment(payments[0]);
    } catch (err) {
      setError("Failed to load payment details");
      console.error(err);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-neutral-900 to-black px-6 py-10">

      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-extrabold text-white">Properties</h1>
            <p className="text-gray-400 mt-2">
              Manage and oversee all your properties
            </p>
          </div>

          {isLandlord && (
            <button
              onClick={() => navigate("/properties/new")}
              className="flex items-center gap-2 px-6 py-3 
                         bg-[#D4AF37] hover:bg-[#e5c56a] 
                         text-black font-semibold rounded-xl shadow-lg transition"
            >
              <PlusIcon className="h-5 w-5" />
              Add Property
            </button>
          )}
        </div>

        {error && <Alert type="error" message={error} />}

        {/* EMPTY */}
        {properties.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-xl border border-white/10 
                          rounded-2xl p-16 text-center">
            <HomeIcon className="h-20 w-20 text-gray-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-white mb-2">
              No Properties Found
            </h2>
            <p className="text-gray-400">
              Start by adding your first property
            </p>
          </div>
        ) : (

          /* GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">

            {properties.map((property) => (
              <div
                key={property._id}
                className="bg-white/10 backdrop-blur-xl 
                           border border-white/10 rounded-2xl 
                           hover:shadow-2xl hover:-translate-y-1 
                           transition-all overflow-hidden"
              >

                {/* IMAGE */}
                <div className="relative h-52 bg-black/30">
                  {property.images?.length ? (
                    <img
                      src={`http://localhost:5000${property.images[0]}`}
                      alt={property.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <HomeIcon className="h-16 w-16 text-gray-500" />
                    </div>
                  )}

                  <span
                    className={`absolute top-4 right-4 px-3 py-1 rounded-full 
                                text-xs font-semibold
                      ${
                        property.status === "available"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}
                  >
                    {property.status}
                  </span>
                </div>

                {/* CONTENT */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {property.name}
                  </h3>

                  <div className="flex items-start gap-2 text-gray-400 mb-4">
                    <MapPinIcon className="h-5 w-5 mt-0.5" />
                    <p className="text-sm">
                      {property.address.street}<br />
                      {property.address.city}, {property.address.state}
                    </p>
                  </div>

                  <div className="flex gap-5 text-sm text-gray-400 mb-4">
                    <span>🛏 {property.bedrooms}</span>
                    <span>🚿 {property.bathrooms}</span>
                    <span>📏 {property.squareFeet || "N/A"} sqft</span>
                  </div>

                  <div className="mb-5 pb-5 border-b border-white/10">
                    <p className="text-2xl font-bold text-[#D4AF37]">
                      {formatCurrency(property.rentAmount)}
                      <span className="text-sm text-gray-400 font-normal">
                        {" "} / month
                      </span>
                    </p>
                  </div>

                  {property.amenities?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-5">
                      {property.amenities.slice(0, 3).map((a, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 text-xs rounded-full 
                                     bg-white/10 text-gray-300"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={() => navigate(`/properties/${property._id}`)}
                      className="flex-1 py-2 bg-white/10 text-white 
                                 rounded-lg hover:bg-white/20 transition"
                    >
                      View
                    </button>

                    {isTenant && property.status === "occupied" && property.currentTenant?._id === user?.id && (
                      <button
                        onClick={() => handleMakePayment(property._id)}
                        className="flex-1 py-2 bg-[#D4AF37] text-black font-semibold
                                   rounded-lg hover:bg-[#e5c56a] transition flex items-center justify-center gap-2"
                      >
                        <CreditCardIcon className="h-4 w-4" />
                        Make Payment
                      </button>
                    )}

                    {isLandlord && (
                      <>
                        <button
                          onClick={() =>
                            navigate(`/properties/${property._id}/edit`)
                          }
                          className="px-4 py-2 bg-emerald-600 
                                     hover:bg-emerald-700 text-white 
                                     rounded-lg transition"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(property._id)}
                          className="px-4 py-2 bg-red-500/20 
                                     text-red-400 hover:bg-red-500/30 
                                     rounded-lg transition"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}

          </div>
        )}
      </div>

      {/* PAYMENT MODAL */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="lux-card max-w-lg w-full">
            <DemoPaymentGateway
              paymentId={selectedPayment._id}
              amount={selectedPayment.amount}
              onSuccess={(data) => {
                setSelectedPayment(null);
                setSuccessMessage(`Payment of ${formatCurrency(selectedPayment.amount)} successful!`);
                setShowSuccessPopup(true);
                fetchProperties();
              }}
            />
          </div>
        </div>
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
              <p className="text-gray-400 text-sm mb-6">Your receipt has been generated and can be downloaded from the Payments page.</p>
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
  );
};

export default Properties;
