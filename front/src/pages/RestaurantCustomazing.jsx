import { PlusIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react"
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { addRestaurant, getRestaurantById, updateRestaurant } from "../action/MainAction";
import { connect } from "react-redux";

function RestaurantCustomazing({ restaurant, addRestaurant, getRestaurantById, updateRestaurant }) {
    const [data, setData] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        admin: {
            name: '',
            email: '',
            password: ''
        }
    });

    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        if (id) {
            getRestaurantById(id)
        } else {
            setData({
                name: '',
                address: '',
                phone: '',
                email: '',
                admin: {
                    name: '',
                    email: '',
                    password: ''
                }
            });
        }
    }, [id]);

    useEffect(() => {
        console.log(restaurant);
        if (restaurant) {
            setData(restaurant);
        }
    }, [restaurant]);

    let handleSubmit = async (e) => {
        e.preventDefault();
        const result = id ? await updateRestaurant(id, data) : await addRestaurant(data);
        if (result === "success") {
            navigate("/restaurants");  // Redirect to restaurants list or another page
        }
    }

    let handleChange = (e) => {
        const { name, value } = e.target;
        const [main, sub] = name.split('.');

        if (sub) {
            setData(prevData => ({
                ...prevData,
                [main]: {
                    ...prevData[main],
                    [sub]: value
                }
            }));
        } else {
            setData(prevData => ({
                ...prevData,
                [name]: value
            }));
        }
    }



    return (
        <main>
            <div className='max-w-screen-xl mx-auto mt-6 bg-white p-2 shadow-md rounded-md'>
                <div className='w-full border-b-[1px] border-b-[#00000033] pb-2'>
                    <div className='flex items-center lg:w-[40%] justify-between flex-col space-y-2 sm:flex-row'>
                        <h2 className='font-bold '>Restoran Tənzimləmələri</h2>
                        {
                            id ? <NavLink to={"/restaurant-customazing"}
                                type="button"
                                className="flex w-full flex-wrap sm:w-fit items-center justify-center rounded-md bg-[#206bc4] px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-bg-[#2059c4] hover:bg-[#2059c4] "
                                data-autofocus
                            >
                                <PlusIcon className="inline-block h-3 w-3 mr-1" aria-hidden="true" />
                                Yeni restoran əlavə et
                            </NavLink> : null
                        }

                    </div>
                </div>

                <div className='lg:w-[50%] mt-4 p-3 bg-[#c3d6ff32] rounded'>
                    <form className="space-y-4 " onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                                Restoran adı
                            </label>
                            <div className="mt-2">
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-gray-200 sm:text-sm sm:leading-6"
                                    onChange={handleChange}
                                    value={data?.name}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="address" className="block text-sm font-medium leading-6 text-gray-900">
                                Adresi
                            </label>
                            <div className="mt-2">
                                <input
                                    id="address"
                                    name="address"
                                    type="text"
                                    required
                                    className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-gray-200 sm:text-sm sm:leading-6"
                                    onChange={handleChange}
                                    value={data?.address}
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium leading-6 text-gray-900">
                                Telefon
                            </label>
                            <div className="mt-2">
                                <input
                                    id="phone"
                                    name="phone"
                                    type="text"
                                    required
                                    className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-gray-200 sm:text-sm sm:leading-6"
                                    onChange={handleChange}
                                    value={data?.phone}

                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                                Email
                            </label>
                            <div className="mt-2">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-gray-200 sm:text-sm sm:leading-6"
                                    onChange={handleChange}
                                    value={data?.email}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="admin.name" className="block text-sm font-medium leading-6 text-gray-900">
                                Admin Adı
                            </label>
                            <div className="mt-2">
                                <input
                                    id="admin.name"
                                    name="admin.name"
                                    type="text"
                                    required
                                    className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-gray-200 sm:text-sm sm:leading-6"
                                    onChange={handleChange}
                                    value={data?.admin?.name}
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="admin.email" className="block text-sm font-medium leading-6 text-gray-900">
                                Admin email
                            </label>
                            <div className="mt-2">
                                <input
                                    id="admin.email"
                                    name="admin.email"
                                    type="email"
                                    required
                                    className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-gray-200 sm:text-sm sm:leading-6"
                                    onChange={handleChange}
                                    value={data?.admin?.email}
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="admin.password" className="block text-sm font-medium leading-6 text-gray-900">
                                Admin şifrəsi
                            </label>
                            <div className="mt-2">
                                <input
                                    id="admin.password"
                                    name="admin.password"
                                    type="password"
                                    required
                                    className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-gray-200 sm:text-sm sm:leading-6"
                                    onChange={handleChange}
                                    value={data?.admin?.password}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="flex items-center justify-center rounded-md bg-[#206bc4] px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-bg-[#2059c4] hover:bg-[#2059c4] "
                            data-autofocus
                        >
                            Yadda Saxla
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}

const mapStateToProps = (state) => ({
    restaurant: state.Data.restaurant
})
const mapDispatchToProps = {
    addRestaurant, getRestaurantById, updateRestaurant
};

export default connect(mapStateToProps, mapDispatchToProps)(RestaurantCustomazing);