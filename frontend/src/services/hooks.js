import { useCallback, useEffect, useState } from "react";
import { list } from "./data.js";
/** One resource per request: a failed section does not hide successful sections. */
export function useResource(path) {
  const [state, setState] = useState({ data: [], loading: true, error: "" });
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((value) => value + 1), []);
  useEffect(() => {
    let active = true;
    setState({ data: [], loading: true, error: "" });
    list(path)
      .then((data) => {
        if (active) setState({ data, loading: false, error: "" });
      })
      .catch((error) => {
        if (active)
          setState({ data: [], loading: false, error: error.message });
      });
    return () => {
      active = false;
    };
  }, [path, version]);
  return { ...state, reload };
}
