import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Users,
  Plus,
  ArrowLeft,
  MapPin,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  Info,
  Loader2,
} from "lucide-react";
import { squadAPI } from "../api";
import { Button, Input, Card, Alert } from "../components/ui";
import { usePollingCenters } from "../hooks/usePollingCenters";
import { toast } from "react-toastify";

const CreateSquad = () => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    county: "",
    goal_count: "",
    is_public: true,
    voter_registration_date: "",
    registration_center: "",
  });
  const [error, setError] = useState("");
  const [suggestedSquad, setSuggestedSquad] = useState(null);
  const [showCenterDropdown, setShowCenterDropdown] = useState(false);
  const [centerSearchTerm, setCenterSearchTerm] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const dropdownRef = useRef(null);

  const { centers, isLoading: centersLoading, error: centersError } =
    usePollingCenters();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCenterDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCenters = useMemo(() => {
    if (!centerSearchTerm.trim()) return centers;
    const search = centerSearchTerm.toLowerCase();
    return centers.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        c.location.toLowerCase().includes(search) ||
        c.county.toLowerCase().includes(search) ||
        c.constituency?.toLowerCase().includes(search)
    );
  }, [centers, centerSearchTerm]);

  const selectedCenter = centers.find(
    (c) => c.id === formData.registration_center
  );

  const kenyaCounties = [
    "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo-Marakwet", "Embu",
    "Garissa", "Homa Bay", "Isiolo", "Kajiado", "Kakamega", "Kericho",
    "Kiambu", "Kilifi", "Kirinyaga", "Kisii", "Kisumu", "Kitui",
    "Kwale", "Laikipia", "Lamu", "Machakos", "Makueni", "Mandera",
    "Marsabit", "Meru", "Migori", "Mombasa", "Murang'a", "Nairobi",
    "Nakuru", "Nandi", "Narok", "Nyamira", "Nyandarua", "Nyeri",
    "Samburu", "Siaya", "Taita-Taveta", "Tana River", "Tharaka-Nithi",
    "Trans Nzoia", "Turkana", "Uasin Gishu", "Vihiga", "Wajir", "West Pokot"
  ];

  // Modern toast configurations
  const toastConfig = {
    success: {
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
      className: "border-l-4 border-l-green-500 bg-white shadow-lg",
    },
    error: {
      icon: <AlertCircle className="w-5 h-5 text-red-500" />,
      className: "border-l-4 border-l-red-500 bg-white shadow-lg",
    },
    info: {
      icon: <Info className="w-5 h-5 text-blue-500" />,
      className: "border-l-4 border-l-blue-500 bg-white shadow-lg",
    },
    loading: {
      icon: <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />,
      className: "border-l-4 border-l-gray-500 bg-white shadow-lg",
    },
  };

  const showToast = (type, title, message, options = {}) => {
    toast.dismiss();
    
    const config = toastConfig[type];
    const content = (
      <div className="flex items-start space-x-3 p-2">
        {config.icon}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">{title}</p>
          {message && <p className="text-gray-600 text-sm mt-1">{message}</p>}
          {options.action && (
            <div className="mt-3">{options.action}</div>
          )}
        </div>
      </div>
    );

    const toastOptions = {
      position: "top-center",
      autoClose: options.autoClose || 5000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      className: config.className,
      bodyClassName: "p-0",
      ...options,
    };

    return toast[type](content, toastOptions);
  };

  const createSquadMutation = useMutation({
    mutationFn: (data) => squadAPI.createSquad(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-squads"] });
      queryClient.invalidateQueries({ queryKey: ["squads"] });
      
      showToast("success", "Squad Created", "Your squad has been created successfully!", {
        autoClose: 2000,
      });
      
      setTimeout(() => navigate("/squad"), 1500);
    },
    onError: (err) => {
      console.error("Squad creation error:", err);
      console.error("Error status:", err?.status);
      console.error("Error message:", err?.message);
      console.error("Error response:", err?.response);
      console.error("Error response data:", err?.response?.data);
      console.error("Error response status:", err?.response?.status);
      
      // Robust error handling for different error structures
      const status = err?.status || err?.response?.status;
      const errorData = err?.response?.data || err;
      
      let toastTitle = "Error";
      let toastMessage = "";
      let action = null;

      if (status === 400) {
        // Handle 400 Bad Request - check various possible error message formats
        const errorText = 
          errorData?.non_field_errors?.[0] ||
          errorData?.detail ||
          errorData?.message ||
          errorData?.error ||
          err?.message ||
          "A squad with similar details already exists";

        console.log("Extracted error text:", errorText);

        // Check for existing squad pattern in any error text
        const existingSquadMatch = errorText.match(/Please join "([^"]+)"/);
        
        if (existingSquadMatch) {
          const squadName = existingSquadMatch[1];
          setSuggestedSquad(squadName);
          
          toastTitle = "Squad Already Exists";
          toastMessage = `"${squadName}" is already active at this location. Would you like to join instead?`;
          
          action = (
            <Button
              onClick={() => {
                toast.dismiss();
                navigate("/join-squad");
              }}
              variant="outline"
              size="sm"
              className="border-green-200 text-green-700 hover:bg-green-50"
            >
              Join {squadName}
            </Button>
          );
        } else {
          // Generic 400 error - likely validation or existing squad without specific message
          toastTitle = "Cannot Create Squad";
          toastMessage = errorText || "A squad with similar details may already exist at this location.";
        }
      } else if (status === 401) {
        toastTitle = "Authentication Required";
        toastMessage = "Please log in to create a squad.";
      } else if (status === 403) {
        toastTitle = "Permission Denied";
        toastMessage = "You don't have permission to create a squad.";
      } else if (status === 409) {
        toastTitle = "Squad Already Exists";
        toastMessage = "A squad with similar details already exists.";
      } else if (status >= 500) {
        toastTitle = "Server Error";
        toastMessage = "Please try again in a few moments.";
      } else {
        // Fallback for other errors or no status
        toastTitle = "Failed to Create Squad";
        toastMessage = 
          errorData?.detail || 
          errorData?.message || 
          err?.message || 
          "Please check your information and try again.";
      }

      showToast("error", toastTitle, toastMessage, { action });
      setError(toastMessage);
    },
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) {
      setError("");
      setSuggestedSquad(null);
    }
  };

  const handleCenterSelect = (center) => {
    setFormData((prev) => ({
      ...prev,
      registration_center: center.id,
      county: center.county,
    }));
    setCenterSearchTerm(center.name);
    setShowCenterDropdown(false);
    
    showToast("info", "Center Selected", center.name, {
      autoClose: 2000,
    });
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.name.trim()) errors.push("Squad name is required");
    if (!formData.description.trim()) errors.push("Description is required");
    if (!formData.voter_registration_date) errors.push("Registration date is required");
    
    const county = selectedCenter?.county || formData.county?.trim();
    if (!county) errors.push("Please select a county or registration center");

    if (formData.voter_registration_date) {
      const registrationDate = new Date(formData.voter_registration_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (registrationDate < today) errors.push("Registration date must be in the future");
    }

    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      showToast("error", "Missing Information", validationErrors[0]);
      setError(validationErrors[0]);
      return;
    }

    const county = selectedCenter?.county || formData.county?.trim();
    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      county,
      max_members: formData.goal_count ? parseInt(formData.goal_count) : null,
      is_public: formData.is_public,
      voter_registration_date: formData.voter_registration_date,
      ...(selectedCenter && {
        registration_center: {
          id: selectedCenter.id,
          name: selectedCenter.name,
          county: selectedCenter.county,
          constituency: selectedCenter.constituency,
          ward: selectedCenter.location,
        },
      }),
    };

    showToast("loading", "Creating Squad", "Setting up your squad...", {
      autoClose: false,
      closeOnClick: false,
      draggable: false,
    });

    createSquadMutation.mutate(payload);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Plus className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Squad</h1>
          <p className="text-gray-600">Start your own group and lead the movement</p>
        </motion.div>

        <Card className="p-6">
          {error && (
            <Alert type="error" message={error} onDismiss={() => setError("")}>
              {suggestedSquad && (
                <div className="mt-3">
                  <Button
                    onClick={() => navigate("/join-squad")}
                    variant="outline"
                    size="sm"
                    className="border-green-200 text-green-700 hover:bg-green-50"
                  >
                    Join "{suggestedSquad}" Squad
                  </Button>
                </div>
              )}
            </Alert>
          )}

          {centersError && (
            <Alert
              type="warning"
              message="Unable to load registration centers. You can still create a squad manually."
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              id="name"
              label="Squad Name *"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Enter a unique name for your squad"
              required
            />

            <div>
              <label className="block text-sm font-medium mb-2">Description *</label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Describe your squad's mission, goals, and what you hope to achieve together..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none placeholder-gray-400"
                required
              />
            </div>

            <Input
              id="voter_registration_date"
              label="Voter Registration Date *"
              type="date"
              value={formData.voter_registration_date}
              onChange={(e) => handleChange("voter_registration_date", e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              placeholder="Select target registration date"
              required
            />

            {/* Registration center autocomplete */}
            <div ref={dropdownRef} className="relative">
              <label className="block text-sm font-medium mb-2">
                Registration Center (Optional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  aria-expanded={showCenterDropdown}
                  value={centerSearchTerm}
                  onChange={(e) => {
                    setCenterSearchTerm(e.target.value);
                    setShowCenterDropdown(true);
                  }}
                  onFocus={() => setShowCenterDropdown(true)}
                  placeholder="Search by center name, location, or constituency..."
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                  disabled={centersLoading || centersError}
                />
                <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
              </div>

              {showCenterDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {centersLoading ? (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        Loading registration centers...
                      </div>
                    </div>
                  ) : filteredCenters.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      {centerSearchTerm
                        ? "No centers found. Try a different search term."
                        : "Start typing to search for registration centers..."}
                    </div>
                  ) : (
                    filteredCenters.slice(0, 10).map((center) => (
                      <button
                        key={center.id}
                        type="button"
                        onClick={() => handleCenterSelect(center)}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors text-sm border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{center.name}</div>
                        <div className="text-xs text-gray-500 flex items-center mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {center.location}, {center.county}
                          {center.constituency && ` • ${center.constituency}`}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {!selectedCenter && (
              <div>
                <label className="block text-sm font-medium mb-2">County *</label>
                <select
                  id="county"
                  value={formData.county}
                  onChange={(e) => handleChange("county", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select your county</option>
                  {kenyaCounties.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}

            <Input
              id="goal_count"
              label="Maximum Members (Optional)"
              type="number"
              value={formData.goal_count}
              onChange={(e) => handleChange("goal_count", e.target.value)}
              min="2"
              placeholder="e.g., 10 (leave empty for no limit)"
            />

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_public}
                  onChange={(e) => handleChange("is_public", e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring focus:ring-blue-200"
                />
                <span className="ml-2 text-sm text-gray-700 font-medium">
                  Make squad public (visible to everyone)
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-2 ml-6">
                Public squads can be discovered and joined by other users. Private squads require invitations.
              </p>
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => navigate("/join-squad")}
                disabled={createSquadMutation.isPending}
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              <Button 
                type="submit" 
                loading={createSquadMutation.isPending}
                className="flex-1"
              >
                <Users className="h-4 w-4 mr-2" /> 
                {createSquadMutation.isPending ? "Creating Squad..." : "Create Squad"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CreateSquad;