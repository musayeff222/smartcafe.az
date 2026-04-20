import { connect } from "react-redux";
import { getRestaurants } from "../action/MainAction";
import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import { PlusIcon } from "@heroicons/react/24/outline";

function Restaurants({ restaurants, getRestaurants }) {

    useEffect(() => {
        getRestaurants()
    },[])

    return (
        <main>
            <div className="max-w-screen-2xl mx-auto mt-10">
                <div className='w-full border-b-[1px] border-b-[#00000033] pb-2'>
                    <div className='flex items-center  justify-between flex-col space-y-2 sm:flex-row'>
                        <h2 className='font-bold '>Restoranlar</h2>

                        <NavLink to={"/restaurant-customazing"}
                            type="button"
                            className="flex w-full flex-wrap sm:w-fit items-center justify-center rounded-md bg-[#206bc4] px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-bg-[#2059c4] hover:bg-[#2059c4] "
                            data-autofocus
                        >
                            <PlusIcon className="inline-block h-3 w-3 mr-1" aria-hidden="true" />
                            Yeni restoran əlavə et
                        </NavLink>
                    </div>
                </div>
                <div className="overflow-x-auto bg-white shadow-md rounded-lg mt-5">
                    <table className="min-w-full">
                        <thead>
                            <tr>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Ad</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Adres</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Nömrə</th>
                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Email</th>
                                <th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {restaurants?.map((restaurant, index) => (
                                <tr key={index} className="even:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{restaurant?.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{restaurant?.address}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{restaurant?.phone}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{restaurant?.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <NavLink to={`/restaurant-customazing/${restaurant.id}`} className="rounded-md bg-[#206bc4] px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-bg-[#2059c4] hover:bg-[#2059c4]">Düzəliş et</NavLink>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>

    );
}

const mapStateToProps = (state) => ({
    restaurants: state.Data.restaurants
})

const mapDispatchToProps = {
    getRestaurants
};



export default connect(mapStateToProps, mapDispatchToProps)(Restaurants);