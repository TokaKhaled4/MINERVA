import MinervaLogo from "../assets/MINERVA Logo - Plain.svg";
import "./SplashScreen.css";
import NavButton from "../Components/NavigationButton"; // <-- import NavButton

function SplashScreen() {
  return (
    <div className="splash-screen">
      <div className="lava-lamp-bg" aria-hidden="true">
      </div>
      <div className="splash-content">
        <div>
          <a href="https://react.dev" target="_blank">
            <img src={MinervaLogo} className="logo" alt="Minerva logo" />
          </a>
        </div>
        <h1>Get started with MINERVA to unlock a whole new world of learning!</h1>

        <div className="card">
          <NavButton to="/Login" label="Login" />
          <NavButton to="/SignUp" label="SignUp" />
          <p>
            Or continue as <a href="/Chat" target="blank">guest</a>
          </p>
        </div>

        {/* <p className="read-the-docs">
          Click on the MINERVA logo to learn more about the team!
        </p> */}
      </div>
    </div>
  );
}

export default SplashScreen;