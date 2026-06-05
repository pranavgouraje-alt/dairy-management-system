import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

function MainLayout({ children }) {
  return (
    <>
      <Navbar />

      <div className="layout-container">
        <Sidebar />

        <div className="content">
          {children}
        </div>
      </div>
    </>
  );
}

export default MainLayout;