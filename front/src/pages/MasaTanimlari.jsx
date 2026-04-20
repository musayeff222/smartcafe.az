import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AddMasa from '../components/AddMasa';
import AddGroupPopup from '../components/AddGroupPopup';
import EditMasaPopup from '../components/EditMasaPopup';
import AccessDenied from '../components/AccessDenied';
import { base_url } from '../api/index';
import { Helmet } from 'react-helmet';
import DontActiveAcount from '../components/DontActiveAcount';
import PasswordScreen from '../components/ScreenPassword';
const API_TABLES_URL = `${base_url}/tables`;
const API_GROUPS_URL = `${base_url}/table-groups`;

const getHeaders = () => ({
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

function MasaTanimlari() {
    const [masaEkle, setMasaEkle] = useState(false);
    const [editMasa, setEditMasa] = useState(null);
    const [groups, setGroups] = useState([]);
    const [masaGroupPopup, setMasaGroupPopup] = useState(false);
    const [masas, setMasas] = useState([]);
    const [editGroup, setEditGroup] = useState(null);
    const [ActiveUser, setActiveUser] = useState(false);
    const [showActions, setShowActions] = useState(null);
    const [accessDenied, setAccessDenied] = useState(false); 
    // Fetch groups from the API
    const fetchGroups = async () => {
        try {
            const response = await axios.get(API_GROUPS_URL, getHeaders());
            setGroups(response.data);
        } catch (error) {
            if (error.response && error.response.status === 403 && error.response.data.message === "User does not belong to any  active restaurant.") {
                setActiveUser(true); // Set access denied if response status is 403
            }
            if (error.response && error.response.status === 403 && error.response.data.message === "Forbidden") {
                // setAccessDenied(true); // Set access denied if response status is 403
            } else {
                console.error('Error loading customers:', error);
            }
        }
    };

    // Fetch masas from the API
    const fetchMasas = async () => {
        try {
            const response = await axios.get(API_TABLES_URL, getHeaders());
            setMasas(response.data.tables);
        } catch (error) {
            if (error.response && error.response.status === 403 && error.response.data.message === "User does not belong to any  active restaurant.") {
                setActiveUser(true); // Set access denied if response status is 403
            }
            if (error.response && error.response.status === 403 && error.response.data.message === "Forbidden") {
                // setAccessDenied(true); // Set access denied if response status is 403
            } else {
                console.error('Error loading customers:', error);
            }
        }
    };

    // Edit an existing masa
    const handleEditMasa = async (updatedMasa) => {
        try {
            await axios.put(`${API_TABLES_URL}/${updatedMasa.id}`, updatedMasa, getHeaders());
            setMasas(masas.map(masa =>
                masa.id === updatedMasa.id ? updatedMasa : masa
            ));
            setEditMasa(null);
        } catch (error) {
            if (error.response && error.response.status === 403 && error.response.data.message === "User does not belong to any  active restaurant.") {
                setActiveUser(true); // Set access denied if response status is 403
            }
            if (error.response && error.response.status === 403 && error.response.data.message === "Forbidden") {
                setAccessDenied(true); // Set access denied if response status is 403
            } else {
                
                console.error('Error updating masa:', error);
            }
        }
    };

    const handleDeleteMasa = async (id) => {
        try {
            await axios.delete(`${API_TABLES_URL}/${id}`, getHeaders());
            setMasas(masas.filter(masa => masa.id !== id));
        } catch (error) {
            if (error.response && error.response.status === 403 && error.response.data.message === "User does not belong to any  active restaurant.") {
                setActiveUser(true); // Set access denied if response status is 403
            }
            if (error.response && error.response.status === 403 && error.response.data.message === "Forbidden") {
                setAccessDenied(true); // Set access denied if response status is 403
            } else {
               
                console.error('Error deleting masa:', error);
            }
        }
    };

    // Handle editing an existing masa
    const handleEdit = (masa) => {
        setEditMasa(masa);
    };

    // Handle saving an edited masa
    const handleSave = (updatedMasa) => {
        handleEditMasa(updatedMasa);
    };

    // Handle deleting a masa
    const handleDelete = (id) => {
        handleDeleteMasa(id);
    };

    // Open popup for editing a group
    const handleEditGroupClick = (group) => {
        setEditGroup(group);
        setMasaGroupPopup(true);
    };

    // Add a new group
    const handleAddGroup = async (newGroup) => {
        try {
            const response = await axios.post(API_GROUPS_URL, newGroup, getHeaders());
            setGroups([...groups, response.data]);
            setMasaGroupPopup(false);
        } catch (error) {
            if (error.response && error.response.status === 403 && error.response.data.message === "User does not belong to any  active restaurant.") {
                setActiveUser(true); // Set access denied if response status is 403
            }
            if (error.response && error.response.status === 403 && error.response.data.message === "Forbidden") {
                setAccessDenied(true); // Set access denied if response status is 403
            } else {
               
                console.error('Error deleting masa:', error);
            }
        }
    };

    // Edit an existing group
    const handleEditGroup = async (updatedGroup) => {
        try {
            await axios.put(`${API_GROUPS_URL}/${updatedGroup.id}`, updatedGroup, getHeaders());
            setGroups(groups.map(group =>
                group.id === updatedGroup.id ? updatedGroup : group
            ));
            setEditGroup(null);
            setMasaGroupPopup(false);
        } catch (error) {
            if (error.response && error.response.status === 403 && error.response.data.message === "User does not belong to any  active restaurant.") {
                setActiveUser(true); // Set access denied if response status is 403
            }
            if (error.response && error.response.status === 403 && error.response.data.message === "Forbidden") {
                setAccessDenied(true); // Set access denied if response status is 403
            } else {
               
                console.error('Error deleting masa:', error);
            }
        }
    };

    // Delete a group
    const handleDeleteGroup = async (id) => {
        try {
            await axios.delete(`${API_GROUPS_URL}/${id}`, getHeaders());
            setGroups(groups.filter(group => group.id !== id));
        } catch (error) {
            if (error.response && error.response.status === 403 && error.response.data.message === "User does not belong to any  active restaurant.") {
                setActiveUser(true); // Set access denied if response status is 403
            }
            if (error.response && error.response.status === 403 && error.response.data.message === "Forbidden") {
                setAccessDenied(true); // Set access denied if response status is 403
            } else {
               
                console.error('Error deleting masa:', error);
            }
        }
    };

    useEffect(() => {
        fetchGroups();
        fetchMasas();
    }, []);
    // if (ActiveUser) return <DontActiveAcount onClose={setActiveUser}/>;
    if (accessDenied) return <AccessDenied onClose={setAccessDenied}/>;
    return (
        <>
              <PasswordScreen />

                             <Helmet>
        <title>Masa tərifləri | Smartcafe</title>
        <meta name="description" content='Restoran proqramı | Kafe - Restoran idarə etmə sistemi ' />
      </Helmet>
        <section className='p-4'>
            <div className='flex flex-col md:flex-row rounded border bg-white'>
                {/* Sidebar for Groups */}
                <div className='w-full md:w-1/4 border-b md:border-r border-gray-300 bg-gray-50 p-3'>
                    <h3 className='font-semibold mb-4'>Masa Grupları</h3>
                    <button
                        onClick={() => setMasaGroupPopup(true)}
                        className='mb-4 w-full bg-sky-600 font-medium py-2 px-4 rounded text-white'
                    >
                        Yeni masa grubu yarat
                    </button>
                    <ul className="list-disc pl-5">
                        {groups.map(group => (
                            <li key={group.id} className="flex justify-between items-center mb-2 border-b border-gray-300">
                                <span>{group.name}</span>
                                <div>
                                    <button
                                        onClick={() => handleEditGroupClick(group)}
                                        className='mx-1 rounded px-3 py-1 bg-red-600 text-white'
                                    >
                                        Yeniləyin
                                    </button>
                                    <button
                                        onClick={() => handleDeleteGroup(group.id)}
                                        className='mx-1 rounded px-3 py-1 bg-blue-500 text-white'
                                    >
                                        Sil
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Main Content for Masas */}
                <div className='w-full md:w-3/4 p-3'>
                    <div className='flex flex-col md:flex-row items-center justify-between mb-4'>
                        <h4 className="font-semibold">Masa Tanımları</h4>
                        {!masaEkle ? (
                            <button
                                onClick={() => setMasaEkle(true)}
                                className='bg-sky-600 font-medium py-2 px-4 rounded text-white'
                            >
                                + Yeni masa yarat
                            </button>
                        ) : (
                            <button
                                onClick={() => setMasaEkle(false)}
                                className='bg-gray-700 flex items-center gap-1 font-medium py-2 px-4 rounded text-white'
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="bi bi-chevron-double-left" viewBox="0 0 16 16">
                                    <path fillRule="evenodd" d="M8.354 1.646a.5.5 0 0 1 0 .708L2.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0" />
                                    <path fillRule="evenodd" d="M12.354 1.646a.5.5 0 0 1 0 .708L6.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0" />
                                </svg>
                                Geri
                            </button>
                        )}
                    </div>

                    {!masaEkle ? (
              <div className='overflow-x-auto'>
              <table className='w-full text-left border rounded bg-gray-50'>
                  <thead className='border-b border-gray-300'>
                      <tr>
                          <th className='p-3 font-semibold'>Masa adı</th>
                          <th className='p-3 font-semibold'>Grup</th>
                          <th className='p-3 font-semibold'>Detay</th>
                      </tr>
                  </thead>
                  <tbody className='text-sm'>
                      {masas.map(masa => (
                          <tr className='border-b border-gray-300' key={masa.id}>
                              <td className='p-2'>{masa.name}</td>
                              <td className='p-2'>
                                  {groups.find(g => g.id === masa.table_group_id)?.name || 'Belirtilmemiş'}
                              </td>
                              <td className='p-2 relative'>
                                  <button
                                      onClick={() => setShowActions(masa.id === showActions ? null : masa.id)}
                                      className='rounded px-3 py-1 bg-green-500 text-white'
                                  >
                                      Detay
                                  </button>
                                  {showActions === masa.id && (
                                      <div className='absolute right-0 top-full mt-2 w-40 bg-white border border-gray-200 rounded shadow-lg z-10'>
                                          <button
                                              onClick={() => (handleEdit(masa), setShowActions(null))}
                                              className='block w-full text-left px-4 py-2 text-yellow-500 hover:bg-yellow-100'
                                          >
                                              Yeniləyin
                                          </button>
                                          <button
                                              onClick={() => handleDelete(masa.id)}
                                              className='block w-full text-left px-4 py-2 text-red-600 hover:bg-red-100'
                                          >
                                              Sil
                                          </button>
                                      </div>
                                  )}
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
          
                    ) : (
                        <AddMasa onClose={() => setMasaEkle(false)} groups={groups} />
                    )}
                </div>
            </div>
            {editMasa &&
                <EditMasaPopup
                    masa={editMasa}
                    onSave={handleSave}
                    onClose={() => setEditMasa(null)}
                    groups={groups}
                />
            }
            {masaGroupPopup &&
                <AddGroupPopup
                    group={editGroup}
                    onSave={editGroup ? handleEditGroup : handleAddGroup}
                    onClose={() => {
                        setEditGroup(null);
                        setMasaGroupPopup(false);
                    }}
                />
            }
        </section>
        </>

    );
}

export default MasaTanimlari;
