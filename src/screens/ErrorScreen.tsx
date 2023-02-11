import React from "react";
import { useRouteError } from "react-router-dom";

export function ErrorScreen() {
  const error: any = useRouteError();
  console.error(error);

  return (
    <div>
      <h1>Route Error</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      <p>
        Details: <i>{error.statusText || error.message}</i>
      </p>
      <img src="https://sineware.ca/paimonmad.gif" alt="Paimon Mad GIF" style={{width: "20%"}} />
    </div>
  );
}