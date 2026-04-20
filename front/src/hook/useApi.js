import { useState, useCallback } from "react";
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import Cookies from "js-cookie";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { setIsAuth } from "@/components/Redux/Features/auth";
import Swal from "sweetalert2";

// interface ApiResponse<T> {
//   data: T | null;
//   loading: boolean;
//   error: string | null;
//   fetchApi: (
//     endpoint: string,
//     method?: "GET" | "POST" | "PUT" | "DELETE",
//     body?: Record<string, unknown> | FormData,
//     params?: Record<string, string>,
//     customToken?: string
//   ) => Promise<AxiosResponse<T> | null>;
// }

const useApi =  ()  => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch();
  const router = useRouter(); // 🔹 Next.js yönlendirme

  const baseURL = process.env.NEXT_PUBLIC_API_URL;

  const fetchApi = useCallback(
  
    async (
      endpoint,
      method,
      body  = {},
      params = {},
      customToken
    ) => {
      setLoading(true);
      setError(null);
      // const qrID = Cookies.get("qrID");
      try {
        const token = customToken || Cookies.get("token");
        const isFormData = body;

        const fullUrl = endpoint.startsWith('/api/v1') 
          ? `${baseURL}${endpoint.substring(7)}` 
          : `${baseURL}${endpoint}`;

        const config = {
          method,
          url: fullUrl,
          data: body,
          params,
          headers: {
            ...(isFormData ? {} : { "Content-Type": "application/json" }),
            Authorization: token ? `Bearer ${token}` : "",
          },
        };

        const response = await axios.request(config);

        if (
          typeof response.data === "object" &&
          response.data !== null &&
          "data" in response.data &&
          typeof response.data.data === "object" &&
          response.data.data !== null &&
          "token" in response.data.data &&
          typeof response.data.data.token === "string"
        ) {
          const authToken = response.data.data.token;
          Cookies.set("token", authToken, { path: "/", expires: 7 });
          dispatch(setIsAuth(true));
        }

        setData(response.data);
        console.log("response", response);

        return response;
      } catch (err) {

        const status = axiosError.response?.status;
        const errorMessage = axiosError.response?.data?.message || axiosError.message || "Bilinmeyen hata";
        setError(errorMessage);
        if (status === 401) {
          Swal.fire({
            title: "Sessiyanın vaxtı bitib!",
            text: "Yenidən daxil olun",
            icon: "info",
            confirmButtonColor: "hsl(var(--primary))",
            confirmButtonText: "Tamam",
            allowOutsideClick: false,
          }).then(() => {
            dispatch(setIsAuth(false));
            Cookies.remove("token");
            localStorage.removeItem("userData"); 
        
      
          });
        }

        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [baseURL, dispatch, router]
  );

  return { data, loading, error, fetchApi };
};

export default useApi;
