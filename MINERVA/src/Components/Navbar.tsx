import { NavLink } from "react-router-dom";
import NavButton2 from "./NavbarButtons";
import MinervaLogo2 from "../assets/MINERVA Logo - Plain.svg"
import "./Navbar.css";

interface NavbarProps {
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}

export default function Navbar({ sidebarOpen, setSidebarOpen }: NavbarProps) {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <button
          className="navbar-hamburger"
          aria-label={sidebarOpen ? "Close menu" : "Open menu"}
          onClick={() => setSidebarOpen?.(!sidebarOpen)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className="navbar-logo-mark">
          <img src={MinervaLogo2} className="Navlogo" alt="Navbar logo" />
        </div>
        <span className="navbar-app-name">Minerva</span>
      </div>

      <ul className={`navbar-links ${sidebarOpen ? "shifted" : ""}`}>
        <li>
          <NavLink to="/chat" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            Chat
          </NavLink>
        </li>
        <li>
          <NavLink to="/mindmap" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            Mind Map
          </NavLink>
        </li>
        <li>
          <NavLink to="/flashcards" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            Flashcards
          </NavLink>
        </li>
        <li>
          <NavLink to="/Quiz" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            Q&A
          </NavLink>
        </li>
      </ul>

      <div className="navbar-login-signup">
        <NavButton2 to="/Login" label="Login" />
        <NavButton2 to="/SignUp" label="SignUp" />
      </div>
    </nav>
  );
}