import React, { useState } from 'react';

function AddPersonel({ onAdd, onClose }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [type, setType] = useState('');
    const [permissions, setPermissions] = useState({
        'manage-tables':false, // masalar
        'manage-quick-orders':false, // sifarisler
        'manage-customers':false, // musteri
        'access-payments':false, // kasaya erise bilsin
        'manage-payments':false, // kasadan veri silsin
        'manage-tanimlar':false, // tanitimlar
        'manage-restaurants':false, // qenel ayarlar
    });
    const [errors, setErrors] = useState({});

    // Маппинг для отображения прав в удобочитаемые строки
    const permissionLabels = {
        'manage-tables':"Masa işlemleri yapsın (Hesap aç/kapat)", // masalar
        'manage-quick-orders':"Sipariş işlemleri yapsın (Sipariş ekle/yönet)", // sifarisler
        'manage-customers':"Müşterilere erişebilsin", // musteri
        'access-payments':"Kasaya erişebilsin", // kasaya erise bilsin
        'manage-payments':"Kasadan veri silsin", // kasadan veri silsin
        'manage-tanimlar':"Tanımlara erişebilsin", // tanitimlar
        'manage-restaurants':"Ayarlara erişebilsin", // qenel ayarlar
    };

    const handleTypeChange = (e) => {
        setType(e.target.value);
        if (e.target.value !== 'general') {
            setPermissions({
                'manage-tables':false, // masalar
                'manage-quick-orders':false, // sifarisler
                'manage-customers':false, // musteri
                'access-payments':false, // kasaya erise bilsin
                'manage-payments':false, // kasadan veri silsin
                'manage-tanimlar':false, // tanitimlar
                'manage-restaurants':false, // qenel ayarlar
            });
        }
    };

    const handlePermissionChange = (e) => {
        const { name, checked } = e.target;
        setPermissions(prev => ({
            ...prev,
            [name]: checked
        }));
    };

    const validateForm = () => {
        let isValid = true;
        const newErrors = {};

        if (!name) {
            newErrors.name = 'Name is required';
            isValid = false;
        } else if (name.length > 255) {
            newErrors.name = 'Name must be less than 256 characters';
            isValid = false;
        }

        if (!email) {
            newErrors.email = 'Email is required';
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Email is invalid';
            isValid = false;
        }

        if (type === 'general') {
            if (!Object.values(permissions).some(v => v)) {
                newErrors.permissions = 'At least one permission must be selected';
                isValid = false;
            }
        }

        if (!password) {
            newErrors.password = 'Password is required';
            isValid = false;
        } else if (password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
            isValid = false;
        }

        if (password !== passwordConfirmation) {
            newErrors.password_confirmation = 'Passwords do not match';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleAdd = () => {
        if (validateForm()) {
            // Преобразование выбранных прав в массив строк
            const selectedPermissions = Object.entries(permissions)
                .filter(([key, value]) => value)
                .map(([key]) => key);

            const newPersonel = {
                name,
                email,
                role: type,
                password,
                password_confirmation: passwordConfirmation,
                ...(type === 'general' && { permissions: selectedPermissions })
            };

            onAdd(newPersonel);

            // Очистка полей и закрытие формы
            setName('');
            setEmail('');
            setPassword('');
            setPasswordConfirmation('');
            setType('');
            setPermissions({
                'manage-restaurants': false,
                'manage-users': false,
                'manage-roles': false,
                'assign-roles': false,
                'assign-permissions': false
            });
            onClose();
        }
    };

    return (
        <div className='bg-white p-4 rounded shadow-lg'>
            <h4 className='font-semibold mb-3'>Yeni Personel əlavə edin</h4>
            <div className='mb-3'>
                <label className='block mb-1'>Ad Soyad</label>
                <input
                    type='text'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`border rounded w-full p-2 ${errors.name ? 'border-red-500' : ''}`}
                />
                {errors.name && <p className='text-red-500 text-sm'>{errors.name}</p>}
            </div>
            <div className='mb-3'>
                <label className='block mb-1'>E-mail</label>
                <input
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`border rounded w-full p-2 ${errors.email ? 'border-red-500' : ''}`}
                />
                {errors.email && <p className='text-red-500 text-sm'>{errors.email}</p>}
            </div>
            <div className='mb-3'>
                <label className='block mb-1'>Şifre</label>
                <input
                    type='password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`border rounded w-full p-2 ${errors.password ? 'border-red-500' : ''}`}
                />
                {errors.password && <p className='text-red-500 text-sm'>{errors.password}</p>}
            </div>
            <div className='mb-3'>
                <label className='block mb-1'>Şifre Onayla</label>
                <input
                    type='password'
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    className={`border rounded w-full p-2 ${errors.password_confirmation ? 'border-red-500' : ''}`}
                />
                {errors.password_confirmation && <p className='text-red-500 text-sm'>{errors.password_confirmation}</p>}
            </div>
            <div className='mb-3'>
                <label className='block mb-1'>Tip</label>
                <select
                    value={type}
                    onChange={handleTypeChange}
                    className='border rounded w-full p-2'
                >
                    <option value=''>Seçiniz</option>
                    <option value='general'>Genel</option>
                    <option value='waiter'>Garson</option>
                </select>
            </div>

            {type === 'general' && (
                <div className='mb-3'>
                    <h4 className='font-semibold mb-2'>Yetkilendirme</h4>
                    <div className='flex flex-col'>
                        {Object.entries(permissions).map(([key, value]) => (
                            <label key={key} className='flex items-center mb-2'>
                                <input
                                    type='checkbox'
                                    name={key}
                                    checked={value}
                                    onChange={handlePermissionChange}
                                    className='mr-2'
                                />
                                {permissionLabels[key]} {/* Отображение удобочитаемых строк */}
                            </label>
                        ))}
                    </div>
                    {errors.permissions && <p className='text-red-500 text-sm'>{errors.permissions}</p>}
                </div>
            )}

            <div className='flex justify-end gap-2'>
                <button onClick={onClose} className='bg-gray-500 text-white py-1 px-3 rounded'>İptal</button>
                <button onClick={handleAdd} className='bg-blue-500 text-white py-1 px-3 rounded'>əlavə edin</button>
            </div>
        </div>
    );
}

export default AddPersonel;
