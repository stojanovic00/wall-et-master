import React from "react";
import ReactDOM from "react-dom/client";
import { WalletProvider } from "./components/providers/WalletProvider";
import App from "./components/App";
import "./styles/App.css";
import { TokenProvider } from "./components/providers/TokenProvider";
import { TransactionConfirmationProvider } from "./components/providers/TransactionConfirmationProvider";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <WalletProvider>
      <TokenProvider>
        <TransactionConfirmationProvider>
          <App />
        </TransactionConfirmationProvider>
      </TokenProvider>
    </WalletProvider>
  </React.StrictMode>
);
