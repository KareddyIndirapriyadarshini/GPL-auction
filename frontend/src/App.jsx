import { useState } from "react";
import RolePicker from "./components/RolePicker";
import AuctionRoom from "./pages/AuctionRoom";

export default function App() {
  const [role, setRole] = useState(null);
  return role ? <AuctionRoom role={role} onExit={() => setRole(null)} /> : <RolePicker onSelect={setRole} />;
}
