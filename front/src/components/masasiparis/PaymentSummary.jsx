const BASE_VALUE_SIZE = "text-xl "; // Bütün əsas dəyərlər (Masa Toplamı, Qalıq, Ön Ödəniş, PS Club)
// Ümumi Klasslar
const INPUT_BASE_CLASSES = `border text-right w-24 md:w-28 py-1 px-2 font-bold focus:outline-none focus:ring-2 transition-colors ${BASE_VALUE_SIZE}`;
const PREPAYMENT_BUTTON_CLASSES = "bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded-r transition-colors focus:outline-none";
// PS Club Xüsusi Klasslar
const PS_CLUB_WRAPPER = "p-3 bg-blue-50 rounded-lg border border-blue-200";
const PS_CLUB_CURRENCY_BG = `bg-blue-100 text-blue-800 ${BASE_VALUE_SIZE}`;
const PS_CLUB_INPUT_CLASSES = `border-blue-300 rounded-r text-blue-800 bg-white hover:bg-blue-100 focus:ring-blue-500 ${BASE_VALUE_SIZE}`;

const PlusIcon = () => <i className="fa-solid fa-plus text-lg"></i>; 
const SummaryItem = ({ 
  label, 
  value, 
  labelClass = 'text-gray-800', 
  valueClass = 'text-gray-900', 
  currencyClass = 'text-gray-600', 
  wrapperClass = 'p-3 bg-gray-100 rounded-lg border border-gray-200' 
}) => {
    const finalValueClass = `${BASE_VALUE_SIZE} ${valueClass}`;
    const finalCurrencyClass = `${BASE_VALUE_SIZE} ${currencyClass}`;

    return (
      <div className={`flex justify-between items-center ${wrapperClass}`}>
        <span className={`font-bold text-lg md:text-xl ${labelClass}`}>
          {label}:
        </span>
        <div className="flex items-center">
          <span className={`font-extrabold ${finalValueClass}`}>
            {Number(value).toFixed(2)}
          </span>
          <span className={`ml-1 font-bold ${finalCurrencyClass}`}>
            ₼
          </span>
        </div>
      </div>
    );
};

const PaymentSummary = ({
  role,
  totalPrice,
  calculateOverallTotal,
  calculateRemainingAmount,
  setOncedenodePopop,
  isPsClub,
  psPrice,
  inputValue,
  handlePsTotalChange,
  handlePsTotalBlur,
  setHesabKes,
  handlePrint,
  handleDeleteMasa,
  TotalPriceHesab,
  expiredTimerInfo,
  onOpenPsModal
}) => {
  if (role === "waiter") {
    return null; // Ofisiantlar üçün bu paneli göstərmə
  }

  const overallTotal = calculateOverallTotal();
  const remainingAmount = calculateRemainingAmount();
  const isTotalAvailable = totalPrice.total > 0;
  const hasExpiredTimer = isPsClub === 1 && expiredTimerInfo && expiredTimerInfo.isExpired;

  return (
    <div className="flex flex-col gap-4 mt-6 p-4 md:p-6 bg-white rounded-xl shadow-2xl border border-gray-100 w-full max-w-2xl mx-auto">
      {isTotalAvailable ? (
        <>
          <div className="flex justify-between items-center pb-3 border-b border-dashed border-gray-300">
            <span className="font-semibold text-base md:text-lg text-gray-700">Ön Ödəniş:</span>
            <div className="flex items-stretch">
              <div className={`flex items-center border border-r-0 font-medium py-1 px-2 rounded-l bg-gray-50 ${BASE_VALUE_SIZE} text-gray-700`}>
                ₼
              </div>
              <input
                type="text"
                value={Number(totalPrice.total_prepare).toFixed(2)}
                readOnly
                className={`${INPUT_BASE_CLASSES} border-gray-300 bg-gray-50`}
              />
              <button
                onClick={() => setOncedenodePopop(true)}
                className={PREPAYMENT_BUTTON_CLASSES}
              >
                <PlusIcon />
              </button>
            </div>
          </div>

          <SummaryItem 
            label="Masa Toplamı"
            value={totalPrice.total}
          />

          {isPsClub === 1 && psPrice && psPrice.length > 0 && (
            <div className={`flex justify-between items-center ${PS_CLUB_WRAPPER}`}>
              <span className="font-bold text-lg md:text-xl text-blue-800">
                PS Club Toplam:
              </span>
              <div className="flex items-stretch">
                <div className={`flex items-center border border-r-0 font-medium py-1 px-2 rounded-l ${PS_CLUB_CURRENCY_BG}`}>
                  ₼
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={inputValue}
                  onFocus={(e) => e.target.select()}
                  onChange={handlePsTotalChange}
                  onBlur={handlePsTotalBlur}
                  className={`${INPUT_BASE_CLASSES} ${PS_CLUB_INPUT_CLASSES}`}
                />
              </div>
            </div>
          )}

          <div className="flex justify-between items-center p-3 bg-green-200 rounded-lg border border-green-500 shadow-xl mt-2">
            <span className="font-extrabold text-xl text-green-800">
              Ümumi Toplam:
            </span>
            <div className="flex items-center">
              <span className={`font-extrabold ${BASE_VALUE_SIZE} text-green-800`}>
                {overallTotal.toFixed(2)}
              </span>
              <span className={`ml-1 font-bold ${BASE_VALUE_SIZE} text-green-600`}>₼</span>
            </div>
          </div>

          {Number(totalPrice.total_prepare) > 0 && (
            <div className="flex flex-col gap-3 p-2 mx-1 border-t border-dashed border-gray-300">
              <SummaryItem 
                  label="Artıq Ödənilib"
                  value={totalPrice.total_prepare}
                  labelClass="text-green-600 font-medium text-base"
                  valueClass="text-green-700 font-semibold"
                  currencyClass="text-gray-500"
                  wrapperClass="flex justify-between items-center bg-transparent border-0 p-0" 
              />
              <SummaryItem 
                  label="Qalıq"
                  value={remainingAmount}
                  labelClass="text-red-700 font-bold text-lg"
                  valueClass="text-red-700 font-bold"
                  currencyClass="text-red-700 font-bold"
                  wrapperClass="flex justify-between items-center pt-1 bg-transparent border-0 p-0" 
              />
            </div>
          )}
        </>
      ) : (
        <p className="text-center py-6 text-gray-500 text-lg">Hazırda sifariş yoxdur.</p>
      )}
      <TotalPriceHesab
        totalPrice={hasExpiredTimer && !isTotalAvailable ? Number(expiredTimerInfo.price) : overallTotal} 
        setHesabKes={setHesabKes}
        handlePrint={handlePrint}
        handleDeleteMasa={handleDeleteMasa}
      />
    </div>
  );
};

export default PaymentSummary;
