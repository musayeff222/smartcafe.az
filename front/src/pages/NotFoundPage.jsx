import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';

function NotFoundPage() {
    return (
        <>
                                          <Helmet>
        <title>Vay! Səhifə tapılmadı | Smartcafe</title>
        <meta name="description" content='Restoran proqramı | Kafe - Restoran idarə etmə sistemi ' />
      </Helmet>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <h1 className="text-6xl font-bold text-gray-800">404</h1>


            <p className="mt-4 text-xl text-gray-600"> Vay! Səhifə tapılmadı.</p>
            <p className="mt-2 text-gray-500">Axtardığınız səhifə mövcud deyil.</p>
            <Link to="/" className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Əsas səhifəyə qayıt
            </Link>
           
        </div>
        </>
        
    );
}

export default NotFoundPage;
