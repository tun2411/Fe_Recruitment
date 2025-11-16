/**
 * VÍ DỤ: Component sử dụng EmployeeService để call API
 * 
 * Đây là file ví dụ, bạn có thể tham khảo và áp dụng vào component thực tế của mình
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonSpinner,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  LoadingController,
  ToastController,
  AlertController,
} from '@ionic/angular/standalone';
import { EmployeeService, Employee, EmployeeFilters } from '../services/employee.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-employee-list-example',
  templateUrl: './employee-list-example.page.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonSpinner,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
  ],
})
export class EmployeeListExamplePage implements OnInit, OnDestroy {
  employees: Employee[] = [];
  isLoading = false;
  searchForm: FormGroup;
  private subscriptions = new Subscription();

  constructor(
    private employeeService: EmployeeService,
    private formBuilder: FormBuilder,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    this.searchForm = this.formBuilder.group({
      name: [''],
      department: [''],
      position: [''],
    });
  }

  ngOnInit() {
    this.loadEmployees();
  }

  ngOnDestroy() {
    // Quan trọng: Unsubscribe để tránh memory leak
    this.subscriptions.unsubscribe();
  }

  /**
   * Ví dụ 1: Load danh sách employees (GET)
   */
  async loadEmployees() {
    this.isLoading = true;

    const loading = await this.loadingController.create({
      message: 'Đang tải danh sách nhân viên...',
    });
    await loading.present();

    const sub = this.employeeService.getEmployees().subscribe({
      next: (data) => {
        this.employees = data;
        this.isLoading = false;
        loading.dismiss();

        this.showToast('Tải danh sách thành công!', 'success');
      },
      error: async (error) => {
        this.isLoading = false;
        loading.dismiss();
        console.error('Error loading employees:', error);
        this.showToast('Không thể tải danh sách nhân viên', 'danger');
      },
    });

    this.subscriptions.add(sub);
  }

  /**
   * Ví dụ 2: Tìm kiếm employees (GET với query params)
   */
  async searchEmployees() {
    if (this.searchForm.invalid) {
      return;
    }

    const filters: EmployeeFilters = {
      name: this.searchForm.value.name || undefined,
      department: this.searchForm.value.department || undefined,
      position: this.searchForm.value.position || undefined,
      page: 0,
      size: 20,
    };

    this.isLoading = true;
    const loading = await this.loadingController.create({
      message: 'Đang tìm kiếm...',
    });
    await loading.present();

    const sub = this.employeeService.getEmployeesWithFilters(filters).subscribe({
      next: (response) => {
        this.employees = response.content;
        this.isLoading = false;
        loading.dismiss();
        this.showToast(`Tìm thấy ${response.totalElements} kết quả`, 'success');
      },
      error: async (error) => {
        this.isLoading = false;
        loading.dismiss();
        this.showToast('Lỗi khi tìm kiếm', 'danger');
      },
    });

    this.subscriptions.add(sub);
  }

  /**
   * Ví dụ 3: Tạo mới employee (POST)
   */
  async createEmployee(employeeData: Partial<Employee>) {
    const loading = await this.loadingController.create({
      message: 'Đang tạo nhân viên...',
    });
    await loading.present();

    const sub = this.employeeService.createEmployee(employeeData).subscribe({
      next: async (newEmployee) => {
        await loading.dismiss();
        
        // Thêm vào danh sách
        this.employees.push(newEmployee);
        
        this.showToast('Tạo nhân viên thành công!', 'success');
      },
      error: async (error) => {
        await loading.dismiss();
        
        let errorMessage = 'Không thể tạo nhân viên';
        if (error.status === 400) {
          errorMessage = error.error?.message || 'Dữ liệu không hợp lệ';
        } else if (error.status === 409) {
          errorMessage = 'Email đã tồn tại';
        }
        
        this.showToast(errorMessage, 'danger');
      },
    });

    this.subscriptions.add(sub);
  }

  /**
   * Ví dụ 4: Cập nhật employee (PUT)
   */
  async updateEmployee(id: number, employeeData: Employee) {
    const loading = await this.loadingController.create({
      message: 'Đang cập nhật...',
    });
    await loading.present();

    const sub = this.employeeService.updateEmployee(id, employeeData).subscribe({
      next: async (updatedEmployee) => {
        await loading.dismiss();
        
        // Cập nhật trong danh sách
        const index = this.employees.findIndex((e) => e.id === id);
        if (index !== -1) {
          this.employees[index] = updatedEmployee;
        }

        this.showToast('Cập nhật thành công!', 'success');
      },
      error: async (error) => {
        await loading.dismiss();
        this.showToast('Không thể cập nhật', 'danger');
      },
    });

    this.subscriptions.add(sub);
  }

  /**
   * Ví dụ 5: Xóa employee (DELETE)
   */
  async deleteEmployee(id: number) {
    const alert = await this.alertController.create({
      header: 'Xác nhận xóa',
      message: 'Bạn có chắc chắn muốn xóa nhân viên này?',
      buttons: [
        {
          text: 'Hủy',
          role: 'cancel',
        },
        {
          text: 'Xóa',
          role: 'destructive',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Đang xóa...',
            });
            await loading.present();

            const sub = this.employeeService.deleteEmployee(id).subscribe({
              next: async () => {
                await loading.dismiss();
                
                // Xóa khỏi danh sách
                this.employees = this.employees.filter((e) => e.id !== id);

                this.showToast('Xóa thành công!', 'success');
              },
              error: async (error) => {
                await loading.dismiss();
                this.showToast('Không thể xóa', 'danger');
              },
            });

            this.subscriptions.add(sub);
          },
        },
      ],
    });

    await alert.present();
  }

  /**
   * Ví dụ 6: Lấy chi tiết employee (GET by ID)
   */
  async getEmployeeDetail(id: number) {
    const loading = await this.loadingController.create({
      message: 'Đang tải...',
    });
    await loading.present();

    const sub = this.employeeService.getEmployeeById(id).subscribe({
      next: async (employee) => {
        await loading.dismiss();
        console.log('Employee detail:', employee);
        // Hiển thị chi tiết trong modal hoặc navigate đến detail page
      },
      error: async (error) => {
        await loading.dismiss();
        this.showToast('Không thể tải thông tin', 'danger');
      },
    });

    this.subscriptions.add(sub);
  }

  /**
   * Helper method: Hiển thị toast message
   */
  private async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top',
    });
    await toast.present();
  }
}

