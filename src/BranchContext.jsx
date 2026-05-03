import React, { createContext, useContext, useState } from "react";

const BranchContext = createContext();

export function BranchProvider({ children }) {
  const [branch, setBranch] = useState("Nasr City");

  return (
    <BranchContext.Provider value={{ branch, setBranch }}>
      {children}
    </BranchContext.Provider>
  );
}

export const useBranch = () => useContext(BranchContext);