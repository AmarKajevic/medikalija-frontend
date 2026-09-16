import PageBreadcrumb from "@shared/ui/common/PageBreadCrumb";
import DefaultInputs from "@shared/ui/form-elements/DefaultInputs";
import InputGroup from "@shared/ui/form-elements/InputGroup";
import DropzoneComponent from "@shared/ui/form-elements/DropZone";
import CheckboxComponents from "@shared/ui/form-elements/CheckboxComponents";
import RadioButtons from "@shared/ui/form-elements/RadioButtons";
import ToggleSwitch from "@shared/ui/form-elements/ToggleSwitch";
import FileInputExample from "@shared/ui/form-elements/FileInputExample";
import SelectInputs from "@shared/ui/form-elements/SelectInputs";
import TextAreaInput from "@shared/ui/form-elements/TextAreaInput";
import InputStates from "@shared/ui/form-elements/InputStates";
import PageMeta from "@shared/ui/common/PageMeta";

export default function FormElements() {
  return (
    <div>
      <PageMeta
        title="React.js Form Elements Dashboard | TailAdmin - React.js Admin Dashboard Template"
        description="This is React.js Form Elements  Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="From Elements" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <DefaultInputs />
          <SelectInputs />
          <TextAreaInput />
          <InputStates />
        </div>
        <div className="space-y-6">
          <InputGroup />
          <FileInputExample />
          <CheckboxComponents />
          <RadioButtons />
          <ToggleSwitch />
          <DropzoneComponent />
        </div>
      </div>
    </div>
  );
}
