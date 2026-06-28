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
        padding: "8px 24px",
        fontSize: "14px",
        borderRadius: "25px",
        border: "none",
        backgroundColor: "#000",
        color: "white",
        cursor: "pointer",
        margin: "8px",           
        transition: "0.3s",       
      }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#8a3a3a")}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#000")}
    >
      {label}
    </button>
  );
};

export default NavButton;