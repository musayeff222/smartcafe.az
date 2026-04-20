import axios from "axios";
import { changeStateValue } from "../redux/MainReducer";
import { base_url } from "../api";

export const getTables = (filter) => async (dispatch) => {
    try {
        const { data } = await axios.get(`${base_url}/tables`, { params: filter });

        dispatch(changeStateValue({ name: 'tables', value: data }));

    } catch (error) {
        console.error(error);
    }
};

export const getTableCategories = () => async (dispatch) => {
    try {
        const { data } = await axios.get(`${base_url}/table-categories`);

        dispatch(changeStateValue({ name: 'tableCategories', value: data }));

    } catch (error) {
        console.error(error);
    }
};

export const updateTableColors = (id, colors) => async dispatch => {
    try {
        const response = await axios.patch(`${base_url}/restaurants/${id}/colors`, colors);
        dispatch(changeStateValue({
            name: 'restaurant',
            value: response.data
        }));
        return "success";
    } catch (error) {
        console.error("Error updating table colors:", error);
        return "error";
    }
};