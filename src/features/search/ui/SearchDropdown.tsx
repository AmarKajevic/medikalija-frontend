import { useNavigate } from 'react-router'

type Props = {
  results: any[];
  isLoading: boolean;
  onSelect: () => void;
};

const SearchDropdown = ({ results, isLoading ,onSelect}: Props) => {
  const navigate = useNavigate();

  const handleClick = (item: any) => {
    onSelect();
    switch (item.type) {
      case "medicine":
        navigate(`/medicine/${item._id}`);
        break;
      case "patient":
        navigate(`/patient/${item._id}`);
        break;
      case "article":
        navigate(`/articles/${item._id}`);
        break;

    }
  };

  if (isLoading) {
    return (
      <div className="absolute left-0 right-0 mt-2 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-500 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
        Učitavanje...
      </div>
    );
  }

  if (!results.length) {
    return (
      <div className="absolute left-0 right-0 mt-2 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-500 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
        Nema rezultata
      </div>
    );
  }

  return (
    <div className="absolute left-0 right-0 mt-2 max-h-80 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
      {results.map((item) => (
        <div
          key={item._id}
          onClick={() => handleClick(item)}
          className="cursor-pointer border-b border-gray-100 p-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5"
        >
          <div className="font-semibold text-gray-800 dark:text-white/90">{item.name}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{item.type}</div>
        </div>
      ))}
    </div>
  );
};

export default SearchDropdown;