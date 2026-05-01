import axios from "axios";
import { changeStateValue } from "../redux/MainReducer";
import { base_url } from "../api/index";

/** base_url zaten /api ile biter; burada /api/... tekrar ETMEYİN. */

export const logOut = () => async (dispatch) => {
    try {
        await axios.post(`${base_url}/logout`, {}, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
        });
        localStorage.removeItem('token');
        dispatch(changeStateValue({ name: 'token', value: '' }));
    } catch (error) {
        console.error('Logout error', error);
        window.location = '/';
    }
};

export const getRestaurants = () => async dispatch => {
    try {
        const response = await axios.get(`${base_url}/admin-restaurants`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        dispatch(changeStateValue({ name: 'restaurants', value: response.data }));
    } catch (error) {
        console.log(error);
    }
};

export const addRestaurant = (data) => async dispatch => {
    try {
        await axios.post(`${base_url}/admin-restaurants`,
            data,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
        return "success";
    } catch (error) {
        return "error";
    }
};

export const getRestaurantById = (id) => async dispatch => {
    try {
        const response = await axios.get(`${base_url}/admin-restaurants/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        dispatch(changeStateValue({ name: 'restaurant', value: response.data }));
    } catch (error) {
        console.log(error);
    }
};

export const updateRestaurant = (id, data) => async dispatch => {
    try {
        const response = await axios.put(`${base_url}/admin-restaurants/${id}`,
            data,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
        dispatch(changeStateValue({ name: 'restaurant', value: response.data }));
        return "success";
    } catch (error) {
        return "error";
    }
};

export const getTableById = (id) => async (dispatch) => {
    try {
        const response = await axios.get(`${base_url}/tables/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        dispatch(changeStateValue({ name: 'tableDetail', value: response.data }));
    } catch (error) {
        console.error('Table get by id error', error);
    }
};
