import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { Observable } from 'rxjs';
import { IChartData } from '../models/chartData';

@Injectable({
  providedIn: 'root',
})
export class ChartDataService {
  GET_CHART_DATA_ENDPOINT = '/chart-data';

  constructor(
    private http: HttpClient
  ) { }

  getChartData(token: string, projectId: string, sprintIds?: string[], itemIds?: string[]): Observable<IChartData[]> {
    return this.http.get<IChartData[]>(`${environment.api}${this.GET_CHART_DATA_ENDPOINT}/${projectId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        sprintIds: sprintIds || [],
        itemIds: itemIds || []
      }
    });
  }
}
