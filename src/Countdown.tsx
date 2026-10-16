import { useEffect, useState } from "react";
import { formatCountdown } from "./format";

export default function Countdown({ until }: { until: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  return <>{formatCountdown(until - now)}</>;
}