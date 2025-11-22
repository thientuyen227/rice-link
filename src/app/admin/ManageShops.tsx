"use client";

import { useAuth } from "@/contexts/AuthContext";
import { ShopData } from "@/data/shop";
import { Edit, Plus, Trash2, X, RefreshCw } from "lucide-react";
import { useState } from "react";
import { db } from "@/data/fakeDb";

export default function ManageShops() {
  const { shopsList, updateShop, deleteShop, addShop } = useAuth();
  const [editingShop, setEditingShop] = useState<ShopData | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState<Partial<ShopData>>({});


  const handleEdit = (shop: ShopData) => {
    setEditingShop(shop);
    setFormData(shop);
    setIsAddingNew(false);
  };

  const handleAddNew = () => {
    setIsAddingNew(true);
    setEditingShop(null);
    setFormData({
      STT: shopsList.length + 1,
      id: `shop-${Date.now()}`,
      "Tên lò sấy": "",
      "TP/Huyện": "",
      "Địa điểm": "",
      "Tọa độ": [0, 0],
      Rating: 0,
      LimitCapacity: 0,
      "Giá sấy lúa": 0,
      "Giá sấy và bảo quản lúa": 0,
      username: "",
      password: "",
    });
  };

  const handleSave = () => {
    if (!formData["Tên lò sấy"] || !formData.username || !formData.password) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc!");
      return;
    }

    if (isAddingNew) {
      addShop(formData as ShopData);
    } else if (editingShop) {
      updateShop(formData as ShopData);
    }

    setEditingShop(null);
    setIsAddingNew(false);
    setFormData({});
  };

  const handleCancel = () => {
    setEditingShop(null);
    setIsAddingNew(false);
    setFormData({});
  };

  const handleDelete = (shopId: string, shopName: string) => {
    if (confirm(`Bạn có chắc muốn xóa cơ sở sấy "${shopName}"?`)) {
      deleteShop(shopId);
    }
  };

  const handleInputChange = (field: keyof ShopData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleResetPasswords = () => {
    if (confirm("Bạn có chắc muốn đồng bộ lại tất cả mật khẩu về giá trị mặc định (123456)?")) {
      db.updateShopsWithPricing();
      alert("✅ Đã đồng bộ lại mật khẩu thành công! Tất cả mật khẩu đã được reset về 123456.");
      window.location.reload();
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Quản lý tài khoản cơ sở sấy</h2>
        <div className="flex gap-2">
          <button
            onClick={handleResetPasswords}
            className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
            title="Đồng bộ lại mật khẩu về 123456"
          >
            <RefreshCw className="w-5 h-5" />
            Đồng bộ mật khẩu
          </button>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            <Plus className="w-5 h-5" />
            Thêm cơ sở sấy mới
          </button>
        </div>
      </div>

      {(editingShop || isAddingNew) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {isAddingNew ? "Thêm cơ sở sấy mới" : "Chỉnh sửa thông tin cơ sở sấy"}
              </h3>
              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tên cơ sở sấy <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData["Tên lò sấy"] || ""}
                  onChange={(e) => handleInputChange("Tên lò sấy", e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Nhập tên cơ sở sấy"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.username || ""}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Nhập username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.password || ""}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Nhập password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Tỉnh/Huyện
                </label>
                <input
                  type="text"
                  value={formData["TP/Huyện"] || ""}
                  onChange={(e) => handleInputChange("TP/Huyện", e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Nhập tỉnh/huyện"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Địa điểm
                </label>
                <input
                  type="text"
                  value={formData["Địa điểm"] || ""}
                  onChange={(e) => handleInputChange("Địa điểm", e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Nhập địa điểm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Sức chứa (tấn)
                  </label>
                  <input
                    type="number"
                    value={formData.LimitCapacity || 0}
                    onChange={(e) =>
                      handleInputChange("LimitCapacity", Number(e.target.value))
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Đánh giá
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={formData.Rating || 0}
                    onChange={(e) =>
                      handleInputChange("Rating", Number(e.target.value))
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Giá sấy lúa (VNĐ/tấn)
                  </label>
                  <input
                    type="number"
                    value={formData["Giá sấy lúa"] || 0}
                    onChange={(e) =>
                      handleInputChange("Giá sấy lúa", Number(e.target.value))
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Giá sấy và bảo quản (VNĐ/tấn)
                  </label>
                  <input
                    type="number"
                    value={formData["Giá sấy và bảo quản lúa"] || 0}
                    onChange={(e) =>
                      handleInputChange(
                        "Giá sấy và bảo quản lúa",
                        Number(e.target.value)
                      )
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border rounded hover:bg-gray-100 transition"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">STT</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Tên cơ sở sấy
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Username
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Tỉnh/Huyện
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Sức chứa
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                Giá sấy
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {shopsList.map((shop) => (
              <tr key={shop.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{shop.STT}</td>
                <td className="px-4 py-3 text-sm font-medium">
                  {shop["Tên lò sấy"]}
                </td>
                <td className="px-4 py-3 text-sm">{shop.username}</td>
                <td className="px-4 py-3 text-sm">{shop["TP/Huyện"]}</td>
                <td className="px-4 py-3 text-sm">{shop.LimitCapacity} tấn</td>
                <td className="px-4 py-3 text-sm">
                  {shop["Giá sấy lúa"].toLocaleString()} đ/tấn
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleEdit(shop)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                      title="Chỉnh sửa"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(shop.id!, shop["Tên lò sấy"])}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {shopsList.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Chưa có cơ sở sấy nào trong hệ thống
          </div>
        )}
      </div>
    </div>
  );
}

