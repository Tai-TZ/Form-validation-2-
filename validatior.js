function Validator(formSelector, options = {}) {

    var _this = this; // _this la đối tượng khởi tạo constructor func

    function getParent(element, selector) { // từ input tìm ra thẻ cha -> tìm thẻ form-message
        while (element.parentElement) { // lặp khi có parent element
            if (element.parentElement.matches(selector)) {
                return element.parentElement
            }
            else {
                element = element.parentElement // néu không matches thì nhảy ra thẻ cha tiếp
            }
        }
    }

    /**
     * Quy ước tạo rule:
     * - nếu có lỗi thì return 'error message'
     * - nếu không lỗi thí return lại 'undefined'
     */

    // định nghĩa các rules tại object này
    var validatorRules = { // object
        required: function (value) { //function
            return value ? undefined : 'Vui lòng nhập đầy đủ'
        },
        email: function (value) { //function
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; //check mail
            return regex.test(value) ? undefined : 'Vui lòng nhập email'
            //nếu check true -> undefined
        },
        min: function (min) { //function
            return function (value) { //function
                return value.length >= min ? undefined : `Vui lòng nhập tối thiểu ${min} ký tự`
            }
        },

        //phòng trường hợp có max
        max: function (max) { //function
            return function (value) { //function
                return value.length <= max ? undefined : `Vui lòng nhập tối đa ${max} ký tự `
            }
        }
    }


    var formRules = { //chứa tất cả rules trong form,vi du nhu:
        //fullname: "required",
        //email: "required|email",
        //password: "required|min:6", 
    };

    //lấy form element trong DOM `formSelector`
    var formElement = document.querySelector(formSelector) //formSelector la  đối số  truyen vao tu Validator

    //Chỉ lấy khi có  Element trong DOM
    if (formElement) {
        var inputs = formElement.querySelectorAll('[name][rules]')

        for (var input of inputs) {

            //=============== Xử lý đẩy các input và rule vào mảng formRules ===============
            var rules = input.getAttribute('rules').split('|')
            // console.log(`${input.name} - ${count}: ` + rules) console.log('================================================================')
            for (var rule of rules) {
                //console.log(`rule ${count}: ` + rule)
                var ruleInfo;
                var isRuleHasValue = rule.includes(':')
                if (isRuleHasValue) { // tach dau : trong "min:6" 
                    ruleInfo = rule.split(':') // console.log(ruleInfo)
                    rule = ruleInfo[0] // [0] = min, [1] = 6  console.log(rule)
                }


                // tạo mảng / đẩy rule vào mảng formRules
                var ruleFunc = validatorRules[rule]
                if (isRuleHasValue) { //xu ly rule min vi co 2 func long nhau
                    // trong truong hop co 2 func long nhau thi gang lai ruleFunc 
                    ruleFunc = ruleFunc(ruleInfo[1]);
                }

                if (Array.isArray(formRules[input.name])) {
                    formRules[input.name].push(ruleFunc);
                    // lần thứ 2 đã có mảng trog {} thì push rule còn lại vào / console.log(`lan thứ ${count}  - ${input.name} : ` + formRules[input.name])

                } else {
                    formRules[input.name] = [ruleFunc]
                    //lan dau tien formRules la {} rỗng thì tạo mảng chứa các rule trong validatorRules / console.log(`lan thứ chua co[] ${count} - ${input.name} : ` + formRules[input.name])
                }
            }

            //=============== Xử lý sự kiện validate (blur, change,...)===============
            input.onblur = handleValidate; //khi không nhập vào input và out ra ngoài -> báo lỗi
            input.oninput = handleClearError; // Clear lỗi khi đã/đang nhập vào input


        }

        //=============== các hàm thực hiện validate===============

        //hàm báo lỗi khi không nhập dữ liệu vào input
        function handleValidate(event) {
            var rules = formRules[event.target.name] // lấy ra rule của ô input đã chọn / console.log(formRules[event.target.name])
            var errorMessage;
            rules.find(function (rule) {
                errorMessage = rule(event.target.value); // rule nay la 1 function
                return errorMessage;
            })

            //Nếu có lỗi thì hiển thị lỗi ra Web
            if (errorMessage) {
                var formGroup = getParent(event.target, '.form-group')
                if (formGroup) {
                    formGroup.classList.add('invalid') // thêm class Invalid vào .form-group
                    var formMessage = formGroup.querySelector('.form-message');
                    if (formMessage) { // thêm lỗi vào form-message 
                        formMessage.innerText = errorMessage
                    }
                }
            }
            return !errorMessage; // ! đảm bảo type of boolen và đảo ngược gía trị
            // có lỗi true -> false
        }

        // hàm clear lỗi khi nhập đã/đang nhập dữ liệu vào input
        function handleClearError(event) {
            var formGroup = getParent(event.target, '.form-group')
            if (formGroup.classList.contains('invalid')) { //nếu formGroup có class lỗi thì remove class invalid
                formGroup.classList.remove('invalid')

                var formMessage = formGroup.querySelector('.form-message');
                if (formMessage) { //reset message loi thanh string trống
                    formMessage.innerText = ''
                }
            }
        }
        //console.log(formRules)
    }



    //=============== xử lý sự kiện submit ===============
    formElement.onsubmit = function (event) {
        event.preventDefault();
        var inputs = formElement.querySelectorAll('[name][rules]')
        var isValid = true; //không có lỗi
        for (var input of inputs) { //check lướt qua  tất cả input

            var handleValidate1 = handleValidate({ target: input }) // thiết lập input cho target của handleValidate
            if (!handleValidate1) { //phủ định gía trị true của dòng return !errorMessage -> false
                isValid = false;
            }
        }

        //khi không có lỗi thì submit form 
        if (isValid) {

            if (typeof _this.onSubmit === 'function') {
                var enableInput = formElement.querySelectorAll('[name]')
                var formValues = Array.from(enableInput).reduce(function (values, input) {
                    values[input.name] = input.value;
                    return values;
                }, {})

                //gọi lại hàm onSubmit và trả về kèm giá trị của form 
                _this.onSubmit(formValues) // onSubmit là hàm html 55
            }
            else {
                formElement.submit();
            }
        }

    }
}
//formRules[input.name] = input.getAttribute('rules')
//console.log(formRules), cho vao formRules, formRules[input.name] -> thêm input.name vào đối tượng