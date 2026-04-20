
const Error = ({ error, setAccessDenied, setNoOrderModal, setActiveUser }) => {
  if (error.response.data.error == "Stokda kifayət qədər məhsul yoxdur.") {
    alert(error.response.data.error);
    setNoOrderModal(false);
  }
  if (
    error.response &&
    error.response.status === 403 &&
    error.response.data.message ===
      "User does not belong to any active restaurant."
  ) {
    setActiveUser(true);
  } else if (
    error.response &&
    error.response.status === 403 &&
    error.response.data.message === "Forbidden"
  ) {
    console.log(error.response.data.message, "repso");
    setAccessDenied(true);
  } else {
    console.error("Error adding stock to order:", error);
  }
  return;
};

export default Error;
