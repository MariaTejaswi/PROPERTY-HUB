import React, { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import api from "../../services/api";

const MessageLandlordModal = ({ property, landlord, onClose, onSuccess }) => {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSendMessage = async () => {
    if (!message.trim()) {
      setError("Message cannot be empty");
      return;
    }

    setSending(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/messages", {
        recipientIds: [landlord._id],
        subject: `Inquiry About Property: ${property.name}`,
        content: message,
        propertyId: property._id,
        relatedTo: "property",
      });

      setSuccess("Message sent to landlord successfully!");
      setMessage("");
      
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-[#D4AF37]/30 rounded-2xl p-8 w-full max-w-lg shadow-[0_0_30px_rgba(212,175,55,0.2)]">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Message Landlord</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* PROPERTY INFO */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-400">Property</p>
          <p className="text-white font-semibold">{property.name}</p>
          <p className="text-gray-400 text-sm mt-1">
            To: {landlord.name} ({landlord.email})
          </p>
        </div>

        {/* ALERTS */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300 text-sm">
            {success}
          </div>
        )}

        {/* SUBJECT */}
        <div className="mb-4">
          <label className="text-sm text-gray-400 mb-2 block">Subject</label>
          <input
            type="text"
            value={`Inquiry About Property: ${property.name}`}
            disabled
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-gray-300 disabled:opacity-50"
          />
        </div>

        {/* MESSAGE */}
        <div className="mb-6">
          <label className="text-sm text-gray-400 mb-2 block">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hello, I'm interested in renting this property. Please contact me to arrange a viewing..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] resize-none"
            rows="5"
            disabled={sending}
          />
          <p className="text-xs text-gray-500 mt-2">{message.length} characters</p>
        </div>

        {/* BUTTONS */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={sending}
            className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSendMessage}
            disabled={sending || !message.trim()}
            className="flex-1 px-4 py-2.5 bg-[#D4AF37] hover:bg-[#e5c56a] text-black font-semibold rounded-lg transition disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send Message"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageLandlordModal;
