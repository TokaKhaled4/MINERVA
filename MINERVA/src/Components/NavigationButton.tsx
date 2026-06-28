import React from "react";
import { useNavigate } from "react-router-dom";

interface NavButtonProps {
  to: string;      
  label: string; 
}

const NavButton: React.FC<NavButtonProps> = ({ to, label }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(to)}
      style={{
        padding: "12px 24px",
        fontSize: "16px",
        borderRadius: "8px",
        border: "none",
        backgroundColor: "#da7373",
        color: "white",
        cursor: "pointer",
        margin: "8px",           
        transition: "0.3s",       
      }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#8a3a3a")}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#da7373")}
    >
      {label}
    </button>
  );
};

export default NavButton;