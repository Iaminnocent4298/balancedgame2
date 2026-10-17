import { VERSION } from "./version";

export default function VersionLabel() {
  return <div className="version-label">v{VERSION}</div>;
}