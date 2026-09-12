import { useState } from "react";
import GrabberSystem from "./GrabberSystem";
import GrabberAccountDetail from "./GrabberAccountDetail";

export default function GrabberPage() {
  const [detailBindingId, setDetailBindingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function goBack() {
    window.location.href = "/dashboard/";
  }

  if (detailBindingId) {
    return (
      <GrabberAccountDetail
        bindingId={detailBindingId}
        onBack={() => setDetailBindingId(null)}
        onRemoved={() => {
          setDetailBindingId(null);
          setRefreshKey((k) => k + 1);
        }}
      />
    );
  }

  return (
    <GrabberSystem
      key={refreshKey}
      onBack={goBack}
      onOpenDetail={(id) => setDetailBindingId(id)}
    />
  );
}
