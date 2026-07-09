import { CombinationGroup } from "./CombinationGroup";


export const CombinationList = ({ groups }: any) => {
  return (
    <div className="space-y-6">
      {groups.map((group: any) => (
        <CombinationGroup key={group._id} group={group} />
      ))}
    </div>
  );
};