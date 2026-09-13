import React from "react";
import QuickOrderPos from "./quickorder/QuickOrderPos";

const QuickSalePanel = ({ onClose, onComplete }) => (
  <QuickOrderPos mode="overlay" onBack={onClose} onComplete={onComplete} />
);

export default QuickSalePanel;
