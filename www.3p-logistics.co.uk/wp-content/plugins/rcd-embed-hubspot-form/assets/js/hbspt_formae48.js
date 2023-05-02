
const req_hbspt_keys = ['region', 'portal_id', 'form_id', 'target']
const req_form_keys = ['multiselect_input_name']
const req_keys = [...req_hbspt_keys, ...req_form_keys]

let valid = true
req_keys.forEach( req_key => {
	if ( !Object.keys(RCD_EHF).includes(req_key) ){
		valid = false
	}
})

const convertSnakeToCamel = (text) => {
	return text.replace(/([-_][a-z])/ig, ($1) => {
    return $1.toUpperCase()
      .replace('-', '')
      .replace('_', '');
  });
}

if (valid){

	const formCreateOptions = {}

	req_hbspt_keys.forEach( req_key => {
		const form_key_name = convertSnakeToCamel(req_key)
		formCreateOptions[form_key_name] = RCD_EHF[req_key]
	})

	formCreateOptions.onFormReady = ( forms ) => {
		const CurrentForm = forms[0]
		CurrentForm.addEventListener('change', handleFormChange)
		const multiselect_input_name = RCD_EHF.multiselect_input_name
		const MultiselectWrapper = CurrentForm.querySelector(`.${multiselect_input_name}`)
		const InputsULWrapper = MultiselectWrapper.querySelector('.input')

		compose_multiselect_elements(InputsULWrapper)
		InputsULWrapper.style.display = 'none'
	}

	formCreateOptions.onFormSubmitted = () => {
		if ( RCD_EHF.redirect_route && RCD_EHF.redirect_route !== "" ){
			setTimeout(()=>{
				window.location.href = RCD_EHF.redirect_route
			}, 250)
		}
	}

	hbspt.forms.create(formCreateOptions);

}

const compose_multiselect_elements = ( Section ) => {
	const SectionWrapper = Section.parentElement
	const Select = document.createElement('select')
	Select.id = "multiselector"
	Select.classList.add('multiselect')
	Select.setAttribute('multiple', true)

	SectionWrapper.appendChild(Select)
	const OriginalOptions = Section.querySelectorAll('input')
	OriginalOptions.forEach( OriginalOption => {
		const original_value = OriginalOption.value
		const original_name = OriginalOption.name
		const original_label = OriginalOption.parentElement.querySelector('span').innerText
		const Option = document.createElement('option')
		Option.value = original_value
		Option.innerText = original_label
		Option.setAttribute('data-original-name', original_name)
		Select.appendChild(Option)
	})

	/**
	 * Called after a dropdown value changes.
	 * Receives the name and value of selection and the active menu element.
	 *
	 * @param {Array.<string>} values value of selection
	 * @param {string} text name of selection
	 * @param {string|Element} $choice active menu element
	 */
	const handleDropdownChange = (values, text, $choice) => {
		// Update hidden fields
		disable_submit_button()
		update_hidden_form_options( values, `.${RCD_EHF.multiselect_input_name}` )
		enable_submit_button()
	}

	const placeholder = RCD_EHF.multiselect_placeholder && RCD_EHF.multiselect_placeholder !== "" ? RCD_EHF.multiselect_placeholder : "Select one or more"

	jQuery(Select).dropdown({
		placeholder,
		onChange: handleDropdownChange
	})
}

const update_hidden_form_options = ( values, hidden_form_field_wrapper_selector ) => {

	const HiddenFieldWrapper = document.querySelector(hidden_form_field_wrapper_selector)
	if ( !Array.isArray(values) ){
		update_hidden_input_by_value(values, HiddenFieldWrapper)
		return;
	}

	values.forEach( value => {
		update_hidden_input_by_value(value, HiddenFieldWrapper)
	})

}

const update_hidden_input_by_value = (value, Parent = document) => {
	const HiddenInput = Parent.querySelector(`input[value="${value}"]`)
	if ( !HiddenInput.checked ){
		HiddenInput.click()
	}
}

const disable_submit_button = () => {
	const SubmitButton = document.querySelector('.hbspt_form_wrapper input[type="submit"]')
	SubmitButton.value = "Loading..."
	SubmitButton.disabled = true
}

const enable_submit_button = () => {
	const SubmitButton = document.querySelector('.hbspt_form_wrapper input[type="submit"]')
	SubmitButton.value = "Submit"
	SubmitButton.disabled = false
}

const handleFormChange = ( e ) => {
	if ( e.target.type === "checkbox" ){
		return;
	}
	const Select = document.querySelector('.multiselect')
	const values = jQuery(Select).dropdown('get value')
	update_hidden_form_options(values, '.hbspt_form_wrapper')
}