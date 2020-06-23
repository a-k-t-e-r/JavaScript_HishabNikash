var DatabaseController = (function () {
    var Income = function (id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    }

    var Expense = function (id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    }

    var dataStorage = {
        allItems: {
            incomes: [],
            expenses: []
        },

        totals: {
            incomes: 0,
            expenses: 0
        }
    };

    function updateTotals(type) {
        // Update Totals
        var totalSum = 0;
        for (var i = 0; i < dataStorage.allItems[type].length; i++) {
            totalSum += dataStorage.allItems[type][i].value;
        }
        dataStorage.totals[type] = totalSum;
    }

    return {
        addInDb: function (type, desc, val) {
            var id, item;

            // Generate New Id
            if (dataStorage.allItems[type].length > 0) {
                id = dataStorage.allItems[type][dataStorage.allItems[type].length - 1].id + 1;
            } else {
                id = 0;
            }

            // Generate New Object
            if (type === 'incomes') {
                item = new Income(id, desc, val);
            } else if (type === 'expenses') {
                item = new Expense(id, desc, val);
            }

            dataStorage.allItems[type].push(item);

            // Update Totals
            updateTotals(type);
        },

        deleteFromDb: function (type, id) {
            for (var i = 0; i < dataStorage.allItems[type].length; i++) {
                if (id === dataStorage.allItems[type][i].id) {
                    dataStorage.allItems[type].splice(i, 1);
                }
            }

            // Update Totals
            updateTotals(type);
        },

        getItemsStorage: function (type) {
            return dataStorage.allItems[type];
        },

        getTotalsStorage: function (type) {
            return dataStorage.totals[type];
        }
    }
})();

var UIController = (function () {
    var uiSelectors = {
        budgetDate: document.querySelector('.budge-amount__date'),
        budgetAmount: document.querySelector('.budge-amount__number'),
        userDescription: document.querySelector('.user-control__desc'),
        userValue: document.querySelector('.user-control__value'),
        userIncomeButton: document.querySelector('.user-control__incomeButton'),
        userExpenseButton: document.querySelector('.user-control__expenseButton'),
        userReportButton: document.querySelector('.user-control__reportGenerate'),
        userIncomeRow: document.querySelector('.data-lists__income'),
        userExpenseRow: document.querySelector('.data-lists__expense'),
        userAvailableBudget: document.querySelector('.budge-amount__number'),
        userTotalIncomeValue: document.querySelector('.total-income__value'),
        userTotalExpenseValue: document.querySelector('.total-expense__value'),
        userTotalExpensePercent: document.querySelector('.total-expense__percent'),
    }

    return {
        getUiSelectors: function () {
            return uiSelectors;
        },

        refreshUi: function (deleteId) {
            // delete full lists from ui via db
            for (var i = 0; i < DatabaseController.getItemsStorage('incomes').length; i++) {
                var el = document.getElementById('income-' + DatabaseController.getItemsStorage('incomes')[i].id);
                if (el) {
                    el.parentNode.removeChild(el);
                }
            }
            for (var i = 0; i < DatabaseController.getItemsStorage('expenses').length; i++) {
                var el = document.getElementById('expense-' + DatabaseController.getItemsStorage('expenses')[i].id);
                if (el) {
                    el.parentNode.removeChild(el);
                }
            }
            // Forcefully (for omitted value, when delete specific item)
            if (deleteId !== -1) {
                var inEl = document.getElementById('income-' + deleteId);
                if (inEl) {
                    inEl.parentNode.removeChild(inEl);
                }
                var exEl = document.getElementById('expense-' + deleteId);
                if (exEl) {
                    exEl.parentNode.removeChild(exEl);
                }
            }

            // add all db lists to ui
            var htmlIncome;
            for (var i = 0; i < DatabaseController.getItemsStorage('incomes').length; i++) {
                var filledHtml = '<div class="data-lists__income-body" id="income-%id%"><span class="income-body__desc">%description%</span><span class="income-body__value">+ %value%<button type="button" class="income-delete"><ion-icon name="close-outline"></ion-icon></button></span></div>';
                filledHtml = filledHtml.replace('%id%', DatabaseController.getItemsStorage('incomes')[i].id);
                filledHtml = filledHtml.replace('%description%', DatabaseController.getItemsStorage('incomes')[i].description);
                filledHtml = filledHtml.replace('%value%', DatabaseController.getItemsStorage('incomes')[i].value);

                if (i > 0) {    // prevent undefine value from html data
                    htmlIncome += filledHtml;
                } else {
                    htmlIncome = filledHtml;
                }
            }
            if (DatabaseController.getTotalsStorage('incomes') > 0) {
                uiSelectors.userIncomeRow.insertAdjacentHTML('beforeend', htmlIncome);

                uiSelectors.userTotalIncomeValue.textContent = '';
                uiSelectors.userTotalIncomeValue.insertAdjacentHTML('beforeend', '+ ' + DatabaseController.getTotalsStorage('incomes'));
            } else {
                uiSelectors.userTotalIncomeValue.textContent = '';
                uiSelectors.userTotalIncomeValue.insertAdjacentHTML('beforeend', '+ ' + 0);
            }
            /*----------------------------------------------------------------------------------------------------------------*/
            var htmlExpense, sumExpense = 0;
            for (var i = 0; i < DatabaseController.getItemsStorage('expenses').length; i++) {
                var filledHtml = '<div class="data-lists__expense-body" id="expense-%id%"><span class="expense-body__desc">%description%</span><span class="expense-body__value">- %value%<span class="expense-percent" title="(selectedExpense/totalIncome)*100">%percentage% %</span><button type="button" class="expense-delete"><ion-icon name="close-outline"></ion-icon></button></span></div>';
                filledHtml = filledHtml.replace('%id%', DatabaseController.getItemsStorage('expenses')[i].id);
                filledHtml = filledHtml.replace('%description%', DatabaseController.getItemsStorage('expenses')[i].description);
                filledHtml = filledHtml.replace('%value%', DatabaseController.getItemsStorage('expenses')[i].value);
                // calculate indevitual percentage
                var percent = Math.round(DatabaseController.getItemsStorage('expenses')[i].value / DatabaseController.getTotalsStorage('incomes') * 100);
                filledHtml = filledHtml.replace('%percentage%', percent);

                if (i > 0) {    // prevent undefine value from html data
                    htmlExpense += filledHtml;
                } else {
                    htmlExpense = filledHtml;
                }
                sumExpense += DatabaseController.getItemsStorage('expenses')[i].value;
            }
            if (DatabaseController.getItemsStorage('expenses').length > 0) {
                uiSelectors.userExpenseRow.insertAdjacentHTML('beforeend', htmlExpense);

                var text = '- %sum%<span class="total-expense__percent" title="(totalExpense/totalIncome)*100">%percent% %</span>'
                text = text.replace('%sum%', sumExpense);
                text = text.replace('%percent%', Math.round(sumExpense / DatabaseController.getTotalsStorage('incomes') * 100));

                uiSelectors.userTotalExpenseValue.textContent = '';
                uiSelectors.userTotalExpenseValue.insertAdjacentHTML('beforeend', text);
            } else {
                uiSelectors.userTotalExpenseValue.textContent = '';
                uiSelectors.userTotalExpenseValue.insertAdjacentHTML('beforeend', '- 0<span class="total-expense__percent" title="(totalExpense/totalIncome)*100">0 %</span>');
            }

            // Calculate and Set Available Budget to UI
            var budge = DatabaseController.getTotalsStorage('incomes') - DatabaseController.getTotalsStorage('expenses');
            uiSelectors.userAvailableBudget.textContent = '';
            if (budge > 0) {
                uiSelectors.userAvailableBudget.insertAdjacentHTML('beforeend', '+ ' + budge);
            } else {
                uiSelectors.userAvailableBudget.insertAdjacentHTML('beforeend', budge);
            }

            // Refresh User's Inputs
            uiSelectors.userDescription.value = '';
            uiSelectors.userValue.value = '';
        }
    }
})();

var AppController = (function () {
    var months = ["January", "February", "March", "April", "May", "June", "July",
        "August", "September", "October", "November", "December"];

    appInit = function () {
        UIController.getUiSelectors().budgetDate.textContent =
            'Available Budget in ' + months[new Date().getMonth()] + ', ' + new Date().getFullYear();

        console.log('Application has stated.');
        UIController.getUiSelectors().userIncomeButton.addEventListener('click', incomeProcedure);
        UIController.getUiSelectors().userExpenseButton.addEventListener('click', expenseProcedure);
        UIController.getUiSelectors().userReportButton.addEventListener('click', generateReport);
        UIController.getUiSelectors().userIncomeRow.addEventListener('click', removeAIncome);
        UIController.getUiSelectors().userExpenseRow.addEventListener('click', removeAExpense);
    }

    function incomeProcedure() {
        cashFlow('incomes');
    }

    function expenseProcedure() {
        cashFlow('expenses');
    }

    function generateReport() {
        // document.querySelector('.report-budge').textContent = UIController.getUiSelectors().budgetDate.textContent + ' = '
        //     + UIController.getUiSelectors().budgetAmount.textContent;


        // var pdf = new jsPDF('p', 'pt', 'a4');
        // htmlText = document.querySelector('#HTMLtoPDF');
        // specialElementHandlers = {
        //     // Set this id to the element that want to hide
        //     '#hideId': function (element, renderer) {
        //         return true
        //     }
        // }

        // margins = {
        //     left: 20,
        //     top: 10,
        //     width: 545
        // };

        // pdf.fromHTML(
        //     htmlText			// HTML string OR, DOM element reference
        //     , margins.left		// X Coordinate
        //     , margins.top		// Y Coordinate
        //     , {
        //         'width': margins.width,		// Maximum width of content on PDF
        //         'elementHandlers': specialElementHandlers
        //     },

        //     function (dispose) {	// dispose: object with X, Y of the last line add to the PDF
        //         //this allow the insertion of new lines after html
        //         pdf.save('html2pdf.pdf');
        //     }
        // )

        /*
        Font Details of jsPDF
            console: new jsPDF().getFontList();
        */

        var doc = new jsPDF('p', 'pt', 'a4');
        //Lines
        doc.setLineWidth(1650);
        doc.setLineDash([10, 10], 0);
        doc.line(20, 25, 60, 25);

        function setDate() {
            var reportDate = 'Date: ' + months[new Date().getMonth()] + ' ' + new Date().getDate() + ', ' + new Date().getFullYear();
            doc.setFont('courier', 'bold');
            doc.setFontSize(11);
            doc.text(60, 13, reportDate);
        }

        setDate();

        var title = 'Hishab-Nikash';
        doc.setFontSize(40);
        doc.setFont('times', 'bolditalic');
        doc.text(175, 60, title);

        var motto = '- A Budget Analysis Application';
        doc.setFontStyle('italic');
        doc.setFontSize(15);
        doc.text(350, 80, motto);

        // Available Budget
        var budgetText = 'Available Budget of ' + months[new Date().getMonth()] + ', ' + new Date().getFullYear();
        doc.setFontSize(16);
        doc.setFontStyle('italic');
        doc.text(70, 120, budgetText);
        var budgetAmount = '= ' + (DatabaseController.getTotalsStorage('incomes') - DatabaseController.getTotalsStorage('expenses'));
        doc.setFontSize(16);
        doc.setFont('courier', 'normal');
        doc.text(430, 120, budgetAmount);

        // Total Income
        var totalText = 'Total Income';
        doc.setFont('times', 'italic');
        doc.text(70, 140, totalText);
        var totalAmount = '= ' + DatabaseController.getTotalsStorage('incomes');
        doc.setFont('courier', 'normal');
        doc.text(430, 140, totalAmount);

        // Total Expense
        var expenseText = 'Total Expense';
        doc.setFont('times', 'italic');
        doc.text(70, 160, expenseText);
        var expenseAmount = '= ' + DatabaseController.getTotalsStorage('expenses');
        doc.setFont('courier', 'normal');
        doc.text(430, 160, expenseAmount);

        function dataPush(iStart, incomeDataRange, eStart, expenseDataRange) {
            // New Page Date (from page 2...)
            if (iStart >= 13) {
                setDate();
            }

            // Lists of All Incomes
            var incomeHead = 'I N C O M E';
            doc.setTextColor(58, 184, 179);
            doc.setFont('times', 'bold');
            if (iStart >= 13) {
                doc.setFontSize(16);
                doc.text(70, 50, incomeHead);
            } else {
                doc.text(70, 210, incomeHead);
            }

            var incomeListsFirst = incomeListsSecond = '\t', fstPageIncomeTopPos = 230, sndPageIncomeTopPos = 70;
            for (var k = iStart; k < incomeDataRange; k++) {
                incomeListsFirst = (k + 1) + '. ';
                incomeListsFirst += DatabaseController.getItemsStorage('incomes')[k].description;
                doc.setFontSize(14);
                doc.setFont('times', 'normal');
                if (iStart >= 13) {
                    doc.text(100, sndPageIncomeTopPos, incomeListsFirst);
                } else {
                    doc.text(100, fstPageIncomeTopPos, incomeListsFirst);
                }
                incomeListsSecond = '= ' + DatabaseController.getItemsStorage('incomes')[k].value;
                doc.setFont('courier', 'bold');
                if (iStart >= 13) {
                    doc.text(430, sndPageIncomeTopPos, incomeListsSecond);
                    sndPageIncomeTopPos += 20;
                } else {
                    doc.text(430, fstPageIncomeTopPos, incomeListsSecond);
                }
                fstPageIncomeTopPos += 20;
            }

            // Divider
            doc.setTextColor(0, 0, 0);
            if (iStart >= 13) {
                doc.text(60, sndPageIncomeTopPos + 5, '----------------------------------------------------------');
            } else {
                doc.text(60, fstPageIncomeTopPos + 5, '----------------------------------------------------------');
            }

            // Lists of All Expense
            var expenseHead = 'E X P E N S E';
            doc.setTextColor(255, 80, 73);
            doc.setFontSize(16);
            doc.setFont('times', 'bold');
            if (iStart >= 13) {
                doc.text(70, sndPageIncomeTopPos + 40, expenseHead);
            } else {
                doc.text(70, fstPageIncomeTopPos + 40, expenseHead);
            }

            var expenseListsFirst, expenseListsSecond, fstPageIncomeTopPos = fstPageIncomeTopPos + 60,
                sndPageIncomeTopPos = sndPageIncomeTopPos + 60;
            for (var k = eStart; k < expenseDataRange; k++) {
                expenseListsFirst = (k + 1) + '. ';
                expenseListsFirst += DatabaseController.getItemsStorage('expenses')[k].description;
                doc.setFontSize(14);
                doc.setFont('times', 'normal');
                if (iStart >= 13) {
                    doc.text(100, sndPageIncomeTopPos, expenseListsFirst);
                } else {
                    doc.text(100, fstPageIncomeTopPos, expenseListsFirst);
                }

                expenseListsSecond = '= ' + DatabaseController.getItemsStorage('expenses')[k].value;
                doc.setFont('courier', 'bold');
                if (iStart >= 13) {
                    doc.text(430, sndPageIncomeTopPos, expenseListsSecond);
                    sndPageIncomeTopPos += 20;
                } else {
                    doc.text(430, fstPageIncomeTopPos, expenseListsSecond);
                }
                fstPageIncomeTopPos += 20;
            }
        }

        var dataLimit = DatabaseController.getItemsStorage('incomes').length + DatabaseController.getItemsStorage('expenses').length;
        if (dataLimit <= 26) {
            // Data Entering
            dataPush(0, DatabaseController.getItemsStorage('incomes').length, 0, DatabaseController.getItemsStorage('expenses').length);

        } else if (dataLimit > 26) {    // If need Page 2 for 14 to 30 data of both income and expense
            // Data Entering in Page 1
            dataPush(0, 13, 0, 13);

            doc.addPage();      // Add New Page and Set Focus
            //Lines
            doc.setLineWidth(1650);
            doc.setLineDash([10, 10], 0);
            doc.line(20, 25, 60, 25);
            // Data Entering in Page 2
            dataPush(13, DatabaseController.getItemsStorage('incomes').length, 13, DatabaseController.getItemsStorage('expenses').length);
        }

        // Add Footer Design
        var footer = 'Angko_Bidda Enterprise';
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(16);
        doc.setFont('times', 'italic');
        doc.text(230, 825, footer);

        // Generate Report
        doc.save('report_' + months[new Date().getMonth()] + '_' + new Date().getDate() + '_' + new Date().getFullYear() + '.pdf');
    }

    function removeAIncome(event) {
        var id = parseInt(event.target.parentNode.parentNode.parentNode.id.split('-')[1]);
        cashDelete('incomes', id);
    }

    function removeAExpense(event) {
        var id = parseInt(event.target.parentNode.parentNode.parentNode.id.split('-')[1]);
        cashDelete('expenses', id);
    }

    var userDesc = UIController.getUiSelectors().userDescription;
    var userVal = UIController.getUiSelectors().userValue;

    function cashFlow(type) {
        // Set Validation
        if (UIController.getUiSelectors().userDescription.value && UIController.getUiSelectors().userValue.value) {
            // Add to Database
            DatabaseController.addInDb(type, userDesc.value, parseFloat(userVal.value));
            // Add to User Interface
            UIController.refreshUi(-1);
            // Console Database
            if (type === 'incomes') {
                console.log('Income Data Storage:');
            } else if (type === 'expenses') {
                console.log('Expense Data Storage:');
            }
            console.log(DatabaseController.getItemsStorage(type));
        } else {
            alert('Forgot to entry data!');
            //document.getElementsByTagName("input")[2].removeAttribute("disabled");
        }
    }

    function cashDelete(type, id) {
        // Delete data from Database
        DatabaseController.deleteFromDb(type, id);
        // Remove From User Interface
        UIController.refreshUi(id);
        // Console Database
        if (type === 'incomes') {
            console.log('Income Data Storage:');
        } else if (type === 'expenses') {
            console.log('Expense Data Storage:');
        }
        console.log(DatabaseController.getItemsStorage(type));
    }
})();

appInit();