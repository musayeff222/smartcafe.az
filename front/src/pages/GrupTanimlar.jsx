import React, { useState } from "react";
import { pageTitle } from "../config/branding";

function GrupTanimlar({ setGrupTanimlari }) {
  const [grupEkle, setGrupEkle] = useState(false);
  return (
    <>
      {/* <Helmet>
        <title>{pageTitle('Grup Tanimlar')}</title>
        <meta name="description" content='Restoran proqramı | Kafe - Restoran idarə etmə sistemi ' />
      </Helmet> */}
      <div class="absolute w-full h-screen top-0 overflow-hidden p-7 bg-[#444444e6]">
        <div class="w-2/5 h-full bg-white rounded m-auto overflow-hidden border">
          <div class="flex items-center bg-gray-50 justify-between py-1 px-4 uppercase border-b">
            {!grupEkle && (
              <button onClick={() => setGrupEkle(true)} className="btn-ad">
                {" "}
                + Yeni əlavə edin
              </button>
            )}
            {grupEkle && (
              <button
                onClick={() => setGrupEkle(false)}
                className=" bg-gray-700 flex items-center gap-1 font-medium py-2 px-4 rounded text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  fill="currentColor"
                  class="bi bi-chevron-double-left"
                  viewBox="0 0 16 16">
                  <path
                    fill-rule="evenodd"
                    d="M8.354 1.646a.5.5 0 0 1 0 .708L2.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"
                  />
                  <path
                    fill-rule="evenodd"
                    d="M12.354 1.646a.5.5 0 0 1 0 .708L6.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"
                  />
                </svg>
                Geri
              </button>
            )}
            <button
              className="py-1 px-3 bg-black text-white rounded"
              onClick={() => setGrupTanimlari(null)}>
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div className="p-3">
            {!grupEkle ? (
              <table className="w-full text-left border rounded bg-[#fafbfc] mb-3">
                <thead className="border-b border-gray-500 bg-[#e5e5e5]">
                  <tr>
                    <th className="p-3 font-semibold">Adı</th>
                    <th className="p-3 font-semibold">Ödeme tip</th>
                    <th className="p-3 font-semibold">Detay</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr>
                    <td className="p-3">Genel</td>
                    <td className="p-3"></td>
                    <td className="p-3 flex gap-1">
                      <button className="rounded px-2 py-1 bg-red-600 text-white">D</button>
                      <button className="rounded px-2 py-1 bg-blue-500 text-white">S</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <form>
                <div className="border rounded bg-gray-50 p-3">
                  <h3 className="mb-3">Adı</h3>
                  <input
                    className="border rounded mb-4 py-2 px-3 w-full outline-none text-sm font-medium"
                    type="text"
                    name=""
                    id=""
                  />
                  <button className="block bg-sky-600 font-medium py-2 px-4 rounded text-white">
                    Saxla
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default GrupTanimlar;
