import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToHashElement = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      } else {
        // Retry logic for dynamic content
        const retryScroll = setTimeout(() => {
            const el = document.getElementById(location.hash.substring(1));
            if (el) {
                el.scrollIntoView({ behavior: "smooth" });
            }
        }, 500); 
        return () => clearTimeout(retryScroll);
      }
    }
  }, [location]);

  return null;
};

export default ScrollToHashElement;
