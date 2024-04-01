import React, { useState, useEffect } from "react";

function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [profileDetails, setProfileDetails] = useState(null);
  const userId = localStorage.getItem("userId");

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append("profile", file);
    formData.append("userId", userId);

    try {
      const response = await fetch("http://localhost:5000/api/auth/profileupload", {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        setProfilePicture(data.profile_pic);
      } else {
        console.error("Failed to upload profile picture");
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
    }
    fetchProfile();
  };

  const fetchProfile = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/auth/profile/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setProfileDetails(data);
      } else {
        console.error("Failed to fetch profile details");
      }
    } catch (error) {
      console.error("Error fetching profile details:", error);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center text-gray-700 hover:text-gray-900 focus:outline-none"
      >
        {profileDetails && profileDetails.profile_pic ? (
          <img
            src={profileDetails.profile_pic}
            alt="Profile"
            className="w-8 h-8 rounded-full m-2"
          />
        ) : (
          <svg
            className="w-8 h-8 rounded-full m-2 text-gray-400"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
          </svg>
        )}
        {profileDetails && (
          <span className="hidden md:inline-block text-white-600">
            {profileDetails.full_name}
          </span>
        )}
      </button>

      <input
        type="file"
        name="profile"
        id="profile-picture-upload"
        accept="image/*"
        className="hidden"
        onChange={handleProfilePictureUpload}
      />

      {isOpen && (
        <div className="absolute right-0 m-2 w-48 bg-white rounded-md shadow-lg z-10">
          <div className="py-1">
            <div className="flex items-center">
              <label htmlFor="profile-picture-upload">
                {profileDetails ? (
                  <img
                    src={profileDetails.profile_pic}
                    alt="Profile"
                    className="w-8 h-8 rounded-full m-2 hover:cursor-pointer"
                  />
                ) : (
                  <svg
                    className="w-8 h-8 rounded-full m-2 text-gray-400 hover:cursor-pointer"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                  </svg>
                )}
              </label>
              {profileDetails && (
                <span className="hidden md:inline-block">{profileDetails.full_name}</span>
              )}
            </div>
            <hr />
            <button className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              Profile
            </button>
            <button className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              Settings
            </button>
            <button
              onClick={async () => {
                try {
                  const response = await fetch(
                    "http://localhost:5000/api/auth/logout",
                    {
                      method: "POST",
                      credentials: "include",
                    }
                  );
                  if (response.ok) {
                    localStorage.clear();
                    console.log("Logout successful");
                    window.location.href = "/login";
                  } else {
                    console.error("Logout failed:", response.statusText);
                  }
                } catch (error) {
                  console.error("Error logging out:", error);
                }
              }}
              className="block px-4 py-2 text-sm text-red-700 hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileDropdown;
