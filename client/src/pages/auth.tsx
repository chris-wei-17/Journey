import { useState } from "react";
import Login from "./login";
import Register from "./register";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);

  const toggleMode = () => {
    setIsLogin(!isLogin);
  };

  if (isLogin) {
    return <Login onToggleMode={toggleMode} />;
  }

  return <Register onToggleMode={toggleMode} />;
}