import axios from "axios";
import { showAlert } from "./alert";

export const signup = async (name, email, password, passwordConfirm) => {
  try {
    const res = await axios({
      method: "POST",
      url: "/api/v1/users/signup",
      data: { name, email, password, passwordConfirm },
    });
    if (res.data.status === "success") {
      showAlert("success", "Account created successfully!");
      location.assign("/");
    }
  } catch (error) {
    showAlert("error", error.response.data.message);
  }
};
