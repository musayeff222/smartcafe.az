// {/* <div className="border-t-2 border-b-2 border-gray-300 mb-6">
//   <div className="flex space-x-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 py-3">
//     {menu.map((category) => (
//       <div
//         key={category.id}
//         className={`cursor-pointer w-auto h-9 flex-shrink-0 py-0.5 px-6 bg-gray-200 rounded-3xl   shadow-md hover:bg-gray-300 ${
//           selectedCategory === category.id ? "border-2 border-blue-500 bg-red-500 text-white " : ""
//         }`}
//         onClick={() => handleCategoryClick(category.id)}
//       >
//         <span className="font-bold text-lg">{category.name}</span>
//       </div>
//     ))}
//   </div>



//   {selectedCategory && (
//     <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
// {menu
//   .find((category) => category.id === selectedCategory)
//   ?.stocks.map((item, index) => (
//     <div
//       key={item.id || index}
//       className="bg-white border w-auto rounded-lg shadow-lg overflow-hidden cursor-pointer transform transition-transform hover:scale-105 hover:shadow-[0px_10px_40px_rgba(0,0,0,0.4)]"
//       onClick={() => handleItemClick(item)}
//     >
//       <div>
//         <Img
//           src={
//             item.image
//               ? `${img_url}/${item.image}`
//               : "/placeholder-image.jpg"
//           }
//           alt={item.name}
//           className="w-48 h-32 mt-4 object-cover mr-2 rounded-lg border border-gray-300"
//         />
//       </div>

//       <div className="p-4 flex-1 text-left">
//         <h4 className="text-lg font-semibold mb-2">{item.name}</h4>
//         <h4 className="text-sm text-gray-600">{item.description}</h4>
//         <div className="flex items-baseline space-x-1 mt-2">
//           <p className="text-gray-600 font-semibold">{item.price}</p>
//           <p>₼</p>
//         </div>
//       </div>

//     </div>
//   ))}
//     </div>
//   )}
// </div> */}