import { useState } from "react";
import { useNavigate } from "react-router";
import { Button, Persona } from "@fluentui/react-components";
import { useAuth } from "../utils/useAuth.js";
import { LoginForm } from "./LoginForm.js";
import { UserMenu } from "./UserMenu.js";

export function AuthMenu(): JSX.Element {
  const navigate = useNavigate();
  const { currentUser, isLoading, login, logout } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleLoginSubmit = async (subjectId: string) => {
    try {
      await login(subjectId);
      setIsLoginModalOpen(false);
    } catch (error) {
      console.error("Login submission via modal failed:", error);
      setIsLoginModalOpen(false);
      throw error;
    }
  };

  const handlePerformLogout = () => {
    logout();
    setIsLoginModalOpen(false);
    void navigate("/");
  };

  if (isLoading) {
    return <Persona text="Loading..." />;
  }

  if (currentUser) {
    return <UserMenu user={currentUser} onLogout={handlePerformLogout} />;
  }

  return (
    <>
      <Button appearance="primary" onClick={() => setIsLoginModalOpen(true)}>
        Login
      </Button>
      <LoginForm
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSubmit={handleLoginSubmit}
      />
    </>
  );
}
