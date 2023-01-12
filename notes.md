genre => genres

The bookinstance_form template hard-codes the Status values (Maintenance, Available, etc.) and does not "remember" the user's entered values. Consider reimplementing the list, passing in option data from the controller and setting the selected value when the form is re-displayed.

bookinstance_form does not automatically select the instance's book when updating bookinstance