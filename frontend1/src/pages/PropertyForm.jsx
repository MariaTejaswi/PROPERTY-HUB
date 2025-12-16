import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import Loader from "../components/common/Loader";
import Alert from "../components/common/Alert";

const PropertyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    type: "apartment",
    description: "",
    bedrooms: "",
    bathrooms: "",
    squareFeet: "",
    yearBuilt: "",
    rentAmount: "",
    depositAmount: "",
    status: "available",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "USA",
    },
    amenities: [],
  });

  const [amenityInput, setAmenityInput] = useState("");
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  const propertyTypes = ["apartment", "house", "condo", "townhouse", "other"];
  const statusOptions = ["available", "occupied", "maintenance"];
  const commonAmenities = [
    "Swimming Pool",
    "Gym",
    "Parking",
    "Garden",
    "Balcony",
    "Air Conditioning",
    "Heating",
    "Washer/Dryer",
    "Dishwasher",
    "Pet Friendly",
    "Security System",
    "Elevator",
  ];

  useEffect(() => {
    if (isEditMode) fetchProperty();
    // eslint-disable-next-line
  }, [id]);

  const fetchProperty = async () => {
    try {
      const res = await api.get(`/properties/${id}`);
      const p = res.data.property || res.data;
      setFormData({
        ...p,
        rentAmount: p.rentAmount || p.rent || "",
        address: p.address || {},
        amenities: p.amenities || [],
      });
      setExistingImages(p.images || []);
    } catch {
      setError("Failed to fetch property");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const f = name.split(".")[1];
      setFormData((p) => ({ ...p, address: { ...p.address, [f]: value } }));
    } else {
      setFormData((p) => ({ ...p, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        if (k === "address") {
          Object.entries(v).forEach(([a, av]) =>
            fd.append(`address[${a}]`, av)
          );
        } else if (k === "amenities") {
          v.forEach((a, i) => fd.append(`amenities[${i}]`, a));
        } else {
          fd.append(k, v);
        }
      });

      images.forEach((img) => fd.append("images", img));

      if (isEditMode) {
        await api.put(`/properties/${id}`, fd);
        setSuccess("Property updated successfully!");
      } else {
        await api.post("/properties", fd);
        setSuccess("Property created successfully!");
      }

      setTimeout(() => navigate("/properties"), 1200);
    } catch {
      setError("Failed to save property");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-neutral-900 to-black py-10 px-4">
      <div className="max-w-5xl mx-auto">

        {/* HEADER */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/properties")}
            className="text-gray-400 hover:text-[#D4AF37]"
          >
            ← Back
          </button>
          <h1 className="mt-4 text-3xl font-extrabold text-white">
            {isEditMode ? "Edit Property" : "Add New Property"}
          </h1>
          <p className="text-gray-400 mt-1">
            {isEditMode
              ? "Update property details"
              : "Fill in details to add property"}
          </p>
        </div>

        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* CARD WRAPPER */}
          {[
            { title: "Basic Info", fields: ["name", "type", "status", "description"] },
            { title: "Property Details", fields: ["bedrooms", "bathrooms", "squareFeet", "yearBuilt"] },
            { title: "Address", fields: ["street", "city", "state", "zipCode", "country"] },
            { title: "Financial", fields: ["rentAmount", "depositAmount"] },
          ].map((section, idx) => (
            <div
              key={idx}
              className="relative bg-black/60 backdrop-blur-xl border border-[#D4AF37]/30 
                         rounded-2xl p-6 shadow-[0_0_25px_rgba(212,175,55,0.15)]"
            >
              <h3 className="text-lg font-semibold text-[#D4AF37] mb-4">
                {section.title}
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                {section.fields.map((field) => (
                  <input
                    key={field}
                    name={field.startsWith("address") ? `address.${field}` : field}
                    value={
                      field in formData
                        ? formData[field]
                        : formData.address[field] || ""
                    }
                    onChange={handleChange}
                    placeholder={field.replace(/([A-Z])/g, " $1")}
                    className="bg-white/10 border border-white/20 text-white 
                               rounded-lg px-4 py-3 focus:ring-2 
                               focus:ring-[#D4AF37] outline-none"
                  />
                ))}
              </div>
            </div>
          ))}

          {/* ACTION */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-[#D4AF37] hover:bg-[#e5c56a] 
                       text-black font-bold rounded-xl shadow-lg transition"
          >
            {submitting ? "Saving..." : isEditMode ? "Update Property" : "Create Property"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PropertyForm;
