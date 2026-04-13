import React, { useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button } from "../ui/button";
import {
  RenameFormData,
  RenameModalProps,
} from "../../types/rename";

const validationSchema = Yup.object({
  title: Yup.string()
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(150, "Title must be at most 150 characters")
    .required("Title is required"),
});

const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  onClose,
  onRename,
  itemType = 'clip',
  currentTitle = '',
}) => {

  const initialValues: RenameFormData = {
    title: currentTitle,
  };

  // Handle overlay click to close modal
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key press
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleSubmit = (values: RenameFormData) => {
    onRename(values);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      <div className="absolute inset-0 bg-black bg-opacity-90" />
      {/* Modal */}
      <div className="relative bg-black rounded-[50px] border-2 border-[#373737] w-full max-w-[550px] max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-center relative pt-8 pb-6 px-16">
          <h2 className="text-white text-[28px] font-medium leading-[70%] text-center">
            Rename {itemType === 'folder' ? 'Highlight' : 'Clip'}
          </h2>
          <button
            onClick={onClose}
            className="absolute right-8 top-8 text-white hover:text-gray-300 transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0.000147593 13.9131L13.9131 0.000630463L16 2.0875L2.08709 16L0.000147593 13.9131Z"
                fill="currentColor"
              />
              <path
                d="M15.9999 13.9125L2.08694 0L0 2.08687L13.9129 15.9994L15.9999 13.9125Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, isValid }) => (
            <Form className="flex flex-col flex-1">
              {/* Content */}
              <div className="flex-1 overflow-y-auto px-16 py-4 space-y-6">
                {/* Title Field */}
                <div className="space-y-2">
                  <label className="text-white text-[14px] font-medium leading-[70%]">
                    Current Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Field
                      name="title"
                      type="text"
                      placeholder="Enter new title"
                      className={`w-full h-[50px] bg-[#252525] border-2 rounded-xl px-4 text-white text-[16px] placeholder:text-[#707070] focus:outline-none focus:border-[#00BBFF] transition-colors ${
                        errors.title && touched.title
                          ? "border-red-500"
                          : "border-[#252525]"
                      }`}
                    />
                    <ErrorMessage
                      name="title"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex-shrink-0 flex items-center justify-center gap-5 pt-6 pb-10 px-16">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="bg-[#1B1B1B] border-[#00BBFF] text-white hover:bg-[#00BBFF]/10 h-[42px] px-6 rounded-xl text-sm font-medium min-w-[160px]"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={
                    !isValid || !values.title.trim()
                  }
                  className={`
                    h-[42px] px-6 rounded-xl text-sm font-medium min-w-[160px] flex items-center gap-3
                    ${
                      isValid && values.title.trim()
                        ? "bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white hover:opacity-90"
                        : "bg-[#373737] text-[#707070] cursor-not-allowed"
                    }
                  `}
                >
                  {/* Star Icon */}
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M11.8274 6.21162C7.95032 7.02284 7.02281 7.95035 6.2116 11.8274C6.16344 12.0575 5.83651 12.0575 5.78835 11.8274C4.97714 7.95035 4.04963 7.02284 0.172577 6.21162C-0.0575256 6.16347 -0.0575256 5.83653 0.172577 5.78838C4.04963 4.97716 4.97714 4.04965 5.78835 0.172578C5.83651 -0.0575259 6.16344 -0.0575259 6.2116 0.172578C7.02281 4.04965 7.95032 4.97716 11.8274 5.78838C12.0575 5.83653 12.0575 6.16347 11.8274 6.21162Z"
                      fill="currentColor"
                    />
                  </svg>
                  Rename
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default RenameModal;
