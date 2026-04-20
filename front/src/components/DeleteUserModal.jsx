import React from "react";
import { AlertTriangle, X } from "lucide-react";

function DeleteUserModal({ user, onDeleteUser, onClose }) {
  const handleDelete = () => {
    onDeleteUser(user.id);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition z-10"
        >
          <X size={18} />
        </button>

        <div className="p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 mx-auto grid place-items-center mb-4">
            <AlertTriangle size={30} className="text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            İstifadəçini silmək istəyirsinizmi?
          </h3>
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-slate-700">{user.name}</span>{" "}
            adlı restoranın bütün məlumatları silinəcək. Bu əməliyyat geri
            qaytarıla bilməz.
          </p>
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition"
          >
            Ləğv et
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-semibold hover:shadow-md transition"
          >
            Bəli, sil
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteUserModal;
