interface Employee {
uniqueId: number;
name: string;
subordinates: Employee[];
}
interface IEmployeeOrgApp {
ceo: Employee;
}

interface ActionHistory {
  description: string;
  undo(): void;
  redo(): void;
}

interface ChangeSupervisorResult {
  oldSupervisor?: Employee;
  oldSubordinatesIds?: number[];
}

class EmployeeOrgApp implements IEmployeeOrgApp {
  public ceo: Employee;
  public flatList: Employee[] = [];
  public history: ActionHistory[];
  public currentActionIndex: number;

  constructor(ceo: Employee) {
    this.ceo = ceo;
    this.history = [];
    this.currentActionIndex = 0;
    this.flatList = this.flattenSubEmp().concat(this.ceo);
  }

  public move(employeeID: number, supervisorID: number): void {
    if (employeeID === supervisorID) {
      throw new Error(
        `Employee and Supervisor is same, Employee:${employeeID}, Supervisor:${supervisorID}`
      );
    }

    if (employeeID === this.ceo.uniqueId) {
      throw new Error(`The CEO Cannot be a sub employee`);
    }

    const [employee, supervisor] = this.findEmpById(employeeID, supervisorID);

    if (!employee) {
      throw new Error(`Employee ${employeeID}  not found`);
    }
    if (!supervisor) {
      throw new Error(`Employee ${supervisorID}  not found`);
    }

    const { oldSupervisor, oldSubordinatesIds } = this.updateSupervisor(
      employee,
      supervisor
    );

    if (oldSupervisor && oldSubordinatesIds) {
      if (this.currentActionIndex < this.history.length) {
        this.history.splice(this.currentActionIndex);
      }

      this.history.push({
        description: `update Supervisor of ${employee.name} from ${oldSupervisor.name} to ${supervisor.name}`,
        undo: () => {
          this.updateSupervisor(employee, oldSupervisor);

          if (oldSubordinatesIds.length) {
            employee.subordinates = this.findEmpById(...oldSubordinatesIds) as Employee[];

            oldSupervisor.subordinates = oldSupervisor.subordinates.filter(
              (subordinate) => !oldSubordinatesIds.includes(subordinate.uniqueId)
            );
          }
        },
        redo: () => {
          this.updateSupervisor(employee, supervisor);
        },
      });

      this.currentActionIndex++;
    }
  }

  public findEmpById(...ids: number[]): (Employee | null)[] {
    const found: (Employee | null)[] = [];

    const filtered = this.flatList.filter(({ uniqueId }) =>
      ids.includes(uniqueId)
    );

    ids.forEach((id) => {
      const employee = filtered.find(({ uniqueId }) => uniqueId === id);
      found.push(employee || null);
    });

    return found;
  }

  public undo(): void {
    if (this.currentActionIndex > 0) {
      this.currentActionIndex--;
      this.history[this.currentActionIndex].undo();
    }
  }

  public redo(): void {
    if (this.currentActionIndex < this.history.length) {
      this.history[this.currentActionIndex].redo();
      this.currentActionIndex++;
    }
  }


  private updateSupervisor(
    employee: Employee,
    newSupervisor: Employee
  ): ChangeSupervisorResult {
    let result: ChangeSupervisorResult = {};

    for (let i = 0, j = this.flatList.length; i < j; i++) {
      const supervisor = this.flatList[i];

      const SupervisorSubordinates = supervisor.subordinates;
      const employeeSubordinates = employee.subordinates;


      const foundEmployee = SupervisorSubordinates.find(
        ({ uniqueId }) => uniqueId === employee.uniqueId
      );

      if (foundEmployee) {
        if (supervisor.uniqueId === newSupervisor.uniqueId) {
          throw new Error(
            `The employee ${employee.uniqueId} it already subordinate(subemployee) of ${newSupervisor.uniqueId}`
          );
        }

        supervisor.subordinates = SupervisorSubordinates.filter(
          ({ uniqueId }) => uniqueId !== employee.uniqueId
        );
        if (employeeSubordinates.length) {
          employeeSubordinates.forEach((subordinate) => {
            supervisor.subordinates.push(subordinate);
          });
        }

        result = {
          oldSupervisor: supervisor,
          oldSubordinatesIds: employeeSubordinates.map(
            (subordinate) => subordinate.uniqueId
          ),
        };
        employee.subordinates = [];
        newSupervisor.subordinates.push(employee);

        break;
      }
    }
    return result;
  }



  private flattenSubEmp(employee: Employee = this.ceo): Employee[] {
    let flatList: Employee[] = employee.subordinates.flat();

    employee.subordinates.forEach(
      (subordinate) =>
        (flatList = flatList.concat(this.flattenSubEmp(subordinate)))
    );

    return flatList;
  }
}

const emp5Obj: Employee = {
"uniqueId": 5,
"name": "Epmlioe5",
"subordinates": []
}

const emp6Obj: Employee = {
"uniqueId": 6,
"name": "Epmlioe6",
"subordinates": []
}


const emp1Obj: Employee = {
"uniqueId": 1,
"name": "Epmlioe1",
"subordinates": [emp5Obj,emp6Obj]
}

const emp2Obj: Employee = {
"uniqueId": 2,
"name": "Epmlioe2",
"subordinates": [emp1Obj]
}

const emp4Obj: Employee = {
"uniqueId": 4,
"name": "Epmlioe4",
"subordinates": []
}

const emp3Obj: Employee = {
"uniqueId": 3,
"name": "Epmlioe3",
"subordinates": [emp2Obj, emp4Obj]
}

const ceoObj: Employee = {
"uniqueId": 0,
"name": "Mark Zuckerberg",
"subordinates": [emp3Obj]
}

const app = new EmployeeOrgApp(ceoObj);
console.log("initial >>>>>>>>>>>",app.ceo)
app.move(2,4)
console.log("before undo>>>>>>>>>>>",app.ceo)

app.undo()
console.log("after undo>>>>>>>>>>>",app.ceo)

app.redo()
console.log("after redo>>>>>>>>>>>",app.ceo)
