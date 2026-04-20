import React, { useEffect, useState } from 'react';
import { Cog8ToothIcon } from '@heroicons/react/24/outline'
import { getTableCategories } from '../action/TableActions';
import { useDispatch, useSelector } from 'react-redux';
import TableColorModal from './TableColorModal';

const Tabs = ({ handleCategoryChange }) => {
  const [activeTab, setActiveTab] = useState('hamisi');
  const [open, setOpen] = useState(false)
  const tableCategories = useSelector(state => state.tableCategories);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getTableCategories());
  }, [dispatch]);





  return (
    <div className="">
      <nav className="-mb-px flex space-x-3">
        <select name="" id="" onChange={handleCategoryChange}>
          {tableCategories?.map((tab) => (
            <option
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
              ${tab.id === activeTab ? 'border-blue-500 text-blue-600 bg-[#c2deff]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} rounded-md px-3 py-2 text-sm font-medium 
            `}
            >
              {tab.name}
            </option>
          ))}
        </select>

        <div>
          <button onClick={() => setOpen(true)} className='border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 rounded-md px-3 py-2 text-sm font-medium' to={'/settings'}>
            <Cog8ToothIcon className="block h-6 w-6" aria-hidden="true" />
          </button>
          {open && (
            <TableColorModal setOpen={setOpen} />
          )}

        </div>


      </nav>
    </div>
  );
};

export default Tabs;
