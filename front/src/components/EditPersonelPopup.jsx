import React, { useState, useEffect } from 'react';

function EditPersonelPopup({ personel, onSave, onClose }) {
    // Инициализация состояния с дефолтными значениями
    const [name, setName] = useState(personel?.name || '');
    const [email, setEmail] = useState(personel?.email || '');
    const [type, setType] = useState(personel.type || '');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [permissions, setPermissions] = useState({
        'manage-tables':false, // masalar
        'manage-quick-orders':false, // sifarisler
        'manage-customers':false, // musteri
        'access-payments':false, // kasaya erise bilsin
        'manage-payments':false, // kasadan veri silsin
        'manage-tanimlar':false, // tanitimlar
        'manage-restaurants':false, // qenel ayarlar
    });
    const permissionLabels = {
        'manage-tables':"Masa işlemleri yapsın (Hesap aç/kapat)", // masalar
        'manage-quick-orders':"Sipariş işlemleri yapsın (Sipariş ekle/yönet)", // sifarisler
        'manage-customers':"Müşterilere erişebilsin", // musteri
        'access-payments':"Kasaya erişebilsin", // kasaya erise bilsin
        'manage-payments':"Kasadan veri silsin", // kasadan veri silsin
        'manage-tanimlar':"Tanımlara erişebilsin", // tanitimlar
        'manage-restaurants':"Ayarlara erişebilsin", // qenel ayarlar
    };
    const [errors, setErrors] = useState({});
console.log(personel);
    useEffect(() => {
        if (type === 'general' && personel?.permissions) {
            const updatedPermissions = {
                'manage-tables': personel.permissions.some(p => p.name === 'manage-tables'),
                'manage-quick-orders': personel.permissions.some(p => p.name === 'manage-quick-orders'),
                'manage-customers': personel.permissions.some(p => p.name === 'manage-customers'),
                'access-payments': personel.permissions.some(p => p.name === 'access-payments'),
                'manage-payments': personel.permissions.some(p => p.name === 'manage-payments'),
                'manage-tanimlar': personel.permissions.some(p => p.name === 'manage-tanimlar'),
                'manage-restaurants': personel.permissions.some(p => p.name === 'manage-restaurants'),
            };
            setPermissions(updatedPermissions);
        }
    }, [personel, type]);

    const validate = () => {
        const newErrors = {};
        if (!name) newErrors.name = 'Ad soyad is required';
        if (!email || !/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) newErrors.email = 'Valid e-mail is required';
        if (!type) newErrors.type = 'Tip is required';
        if (type === 'general' && !Object.values(permissions).some(Boolean)) newErrors.permissions = 'At least one permission is required';
        if (password && password !== passwordConfirmation) newErrors.password_confirmation = 'Passwords do not match';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (validate()) {
            const updatedPersonel = {
                id: personel.id,
                name,
                email,
                role: type,
                ...(password && { password }),
                ...(passwordConfirmation && { password_confirmation: passwordConfirmation }),
                ...(type === 'general' && { permissions: Object.keys(permissions).filter(key => permissions[key]) })
            };

            onSave(updatedPersonel);

            // Очистка полей и закрытие формы
            onClose();
        }
    };

    const handlePermissionChange = (e) => {
        const { name, checked } = e.target;
        setPermissions(prev => ({
            ...prev,
            [name]: checked
        }));
    };

    return (
        <div className="max-w-mobile fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full overflow-y-auto" style={{ maxHeight: '90vh' }}>
            
        <div className='bg-white p-4 rounded shadow-lg'>
            <h4 className='font-semibold mb-3'>Personel Yeniləyin</h4>
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
                <label className='block mb-1'>Yeni Şifre</label>
                <input
                    type='password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`border rounded w-full p-2 ${errors.password ? 'border-red-500' : ''}`}
                />
            </div>
            <div className='mb-3'>
                <label className='block mb-1'>Şifre Onayla</label>
                <input
                    type='password'
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    className={`border rounded w-full p-2 ${errors.password_confirmation ? 'border-red-500' : ''}`}
                />
            </div>
            <div className='mb-3'>
                <label className='block mb-1'>Tip</label>
                <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className='border rounded w-full p-2'
                >
                    <option value=''>Seçiniz</option>
                    <option value='general'>Genel</option>
                    <option value='waiter'>Garson</option>
                </select>
                {errors.type && <p className='text-red-500 text-sm'>{errors.type}</p>}
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
                                 {permissionLabels[key]} 
                                {/* {key.split(/(?=[A-Z])/).join(' ')} Converts camelCase to readable text */}
                            </label>
                        ))}
                    </div>
                    {errors.permissions && <p className='text-red-500 text-sm'>{errors.permissions}</p>}
                </div>
            )}

            <div className='flex justify-end gap-2'>
                <button onClick={onClose} className='bg-gray-500 text-white py-1 px-3 rounded'>İptal</button>
                <button onClick={handleSave} className='bg-blue-500 text-white py-1 px-3 rounded'>Saxla</button>
            </div>
        </div>
            </div></div>
    );
}

export default EditPersonelPopup;
