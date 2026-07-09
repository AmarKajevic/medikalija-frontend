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
      <div className="absolute left-0 right-0 mt-2 bg-white shadow-xl rounded-lg p-3">
        Loading...
      </div>
    );
  }

  if (!results.length) {
    return (
      <div className="absolute left-0 right-0 mt-2 bg-white shadow-xl rounded-lg p-3">
        Nema rezultata
      </div>
    );
  }

  return (
    <div className="absolute left-0 right-0 mt-2 bg-white shadow-xl rounded-lg max-h-80 overflow-y-auto">
      {results.map((item) => (
        <div
          key={item._id}
          onClick={() => handleClick(item)}
          className="p-3 border-b cursor-pointer hover:bg-gray-100"
        >
          <div className="font-semibold">{item.name}</div>
          <div className="text-sm text-gray-500">{item.type}</div>
        </div>
      ))}
    </div>
  );
};

export default SearchDropdown;